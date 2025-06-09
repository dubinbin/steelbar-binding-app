import { useAsyncStorage } from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import { router, useSegments } from 'expo-router';
import {
  BatteryEmpty,
  BatteryFull,
  BatteryLow,
  BatteryMedium,
  Gear,
  WifiHigh,
} from 'phosphor-react-native';
import { useEffect, useRef, useState } from 'react';
import {
  PermissionsAndroid,
  TouchableOpacity,
  View,
  Text,
  FlatList,
  AppState,
  Dimensions,
} from 'react-native';
import { Button, Dialog, Icon, Modal, Portal, TextInput } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import WifiManager, { WifiEntry } from 'react-native-wifi-reborn';

import { GlobalActivityIndicatorManager } from '../activity-indicator-global';
import { GlobalSnackbarManager } from '../snackbar-global';

import { GlobalConst } from '@/constants';
import { Command } from '@/constants/command';
import { eventBusKey } from '@/constants/event';
import useStore from '@/store';
import { ROBOT_CURRENT_MODE, ROBOT_WORK_MODE } from '@/types';
import eventBus from '@/utils/eventBus';
import { delayed, globalGetConnect, sendCmdDispatch } from '@/utils/helper';

// Wi-Fi 密码存储键
const WIFI_PASSWORDS_STORAGE_KEY = 'wifi_passwords';

export const Header = () => {
  const { top } = useSafeAreaInsets();
  const { setRobotStatus, robotStatus } = useStore((state) => state);
  const [wifiChooseListVisible, setWifiChooseListVisible] = useState(false);
  const [wifiPermission, setWifiPermission] = useState(false);
  const [wifiList, setWifiList] = useState<WifiEntry[]>([]);
  const [wifiPassword, setWifiPassword] = useState('');
  const segments = useSegments();
  const isLoginPage = segments.includes('(login)');
  // 连接WiFi密码对话框是否可见
  const [wifiPasswordDialogVisible, setWifiPasswordDialogVisible] = useState(false);
  const hideWifiPasswordDialog = () => setWifiPasswordDialogVisible(false);
  // 使用已保存密码对话框是否可见
  const [savedPasswordDialogVisible, setSavedPasswordDialogVisible] = useState(false);
  // 保存的Wi-Fi密码
  const [savedWifiPasswords, setSavedWifiPasswords] = useState<{ [ssid: string]: string }>({});
  const wifiPasswordsStorage = useAsyncStorage(WIFI_PASSWORDS_STORAGE_KEY);

  const { width } = Dimensions.get('screen');
  // 当前选择的WiFi SSID, 用于连接WiFi中间临时存储
  const currentSelectedWifi = useRef<string>('');

  // 获取当前连接的WiFi SSID 并监听App状态 当App状态变为active时 获取当前连接的WiFi SSID
  useEffect(() => {
    fetchCurrentConnectWifiSSID();
    loadSavedWifiPasswords();
    getWifiPermission();
    const screenListener = AppState.addEventListener('change', fetchCurrentConnectWifiSSID);

    return () => screenListener.remove();
  }, []);

  // 加载保存的Wi-Fi密码
  const loadSavedWifiPasswords = async () => {
    try {
      const savedPasswords = await wifiPasswordsStorage.getItem();
      if (savedPasswords) {
        setSavedWifiPasswords(JSON.parse(savedPasswords));
      }
    } catch (error) {
      console.error('加载Wi-Fi密码失败', error);
    }
  };

  // 保存Wi-Fi密码
  const saveWifiPassword = async (ssid: string, password: string) => {
    try {
      const newPasswords = { ...savedWifiPasswords, [ssid]: password };
      await wifiPasswordsStorage.setItem(JSON.stringify(newPasswords));
      setSavedWifiPasswords(newPasswords);
    } catch (error) {
      console.error('保存Wi-Fi密码失败', error);
    }
  };

  // 监听WiFi连接状态, 当WiFi连接状态为false时, 设置当前连接的WiFi SSID为空 ,提示重新连接
  useEffect(() => {
    eventBus.subscribe(eventBusKey.WifiEvent, (data: { eConnect: boolean }) => {
      if (!data.eConnect) {
        setRobotStatus({
          currentConnectWifiSSID: '',
        });
        GlobalActivityIndicatorManager.current?.show('WiFi连接失败，请重新连接...', 3000);
      }
    });

    return () => {
      eventBus.unsubscribe(eventBusKey.WifiEvent, (data: { eConnect: boolean }) => {
        if (!data.eConnect) {
          setRobotStatus({
            currentConnectWifiSSID: '',
          });
        }
      });
    };
  }, []);

  const gotoSetting = () => {
    router.push('/(setting)');
  };

  // 获取WiFi权限
  const getWifiPermission = async () => {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      {
        title: 'WiFi权限',
        message: '需要位置权限',
        buttonNegative: '拒绝',
        buttonPositive: '允许',
      }
    );
    if (granted === PermissionsAndroid.RESULTS.GRANTED) {
      setWifiPermission(true);
    } else {
      setWifiPermission(false);
    }
  };

  // 打开WiFi设置
  const openWifiSetting = async () => {
    if (wifiPermission) {
      // 获取wifi列表
      setWifiList([]);
      handleRefreshWifiList();
      setTimeout(() => {
        setWifiChooseListVisible(true);
      }, 100);
    }
  };

  // 获取当前连接的WiFi SSID
  const fetchCurrentConnectWifiSSID = async () => {
    const connectedWifiSSID = await WifiManager.getCurrentWifiSSID();
    setRobotStatus({
      currentConnectWifiSSID: connectedWifiSSID,
    });
  };

  const handleConnectToSocketAgain = async () => {
    GlobalActivityIndicatorManager.current?.show('重新连接中...', 0);

    await delayed(2000);

    globalGetConnect();

    GlobalActivityIndicatorManager.current?.hide();
  };

  const renderBatteryIcon = () => {
    if (robotStatus.electric > 80) {
      return <BatteryFull size={32} weight="bold" />;
    } else if (robotStatus.electric > 50) {
      return <BatteryMedium size={32} weight="bold" />;
    } else if (robotStatus.electric > 20) {
      return <BatteryLow size={32} weight="bold" />;
    } else {
      return <BatteryEmpty size={32} weight="bold" />;
    }
  };

  // 刷新WiFi列表
  const handleRefreshWifiList = async () => {
    const loadWifiList = await WifiManager.loadWifiList();

    // 根据SSID去重
    const uniqueSSIDs = new Map();
    loadWifiList.forEach((wifi) => {
      // 只保留有效的SSID，并且只保留每个SSID的第一个遇到的项
      if (
        wifi.SSID &&
        wifi.SSID !== '(hidden SSID)' &&
        !uniqueSSIDs.has(wifi.SSID) &&
        wifi.SSID.indexOf(GlobalConst.wifiName) !== -1
      ) {
        uniqueSSIDs.set(wifi.SSID, wifi);
      }
    });

    const filteredWifiList = Array.from(uniqueSSIDs.values()).slice(0, 5);
    if (filteredWifiList.length > 0) {
      setWifiList(filteredWifiList);
    }
  };

  // 强制暂停
  const handleForcePause = () => {
    sendCmdDispatch(Command.softStop);
    setRobotStatus({
      robotDangerStatus: true,
      currentMode: ROBOT_CURRENT_MODE.LOCKED,
      currentBindingMode: ROBOT_WORK_MODE.WITHOUT_BINDING,
    });
  };

  // 处理Wi-Fi选择
  const handleWifiSelect = (ssid: string) => {
    currentSelectedWifi.current = ssid;

    // 检查是否有保存的密码
    if (savedWifiPasswords[ssid]) {
      setSavedPasswordDialogVisible(true);
    } else {
      setWifiPasswordDialogVisible(true);
    }
  };

  // 使用保存的密码连接
  const connectWithSavedPassword = async () => {
    setSavedPasswordDialogVisible(false);
    const savedPassword = savedWifiPasswords[currentSelectedWifi.current];

    await connectToWifi(savedPassword);
  };

  // 使用新密码连接
  const connectWithNewPassword = async () => {
    if (currentSelectedWifi.current === '' || wifiPassword.length === 0) {
      GlobalSnackbarManager.current?.show({
        content: '密码不能为空 或 未选择WiFi',
      });
      return;
    }

    await connectToWifi(wifiPassword);

    // 保存密码到存储
    saveWifiPassword(currentSelectedWifi.current, wifiPassword);

    // 清空密码输入框
    setWifiPassword('');
    setWifiPasswordDialogVisible(false);
  };

  // 连接到WiFi的核心逻辑
  const connectToWifi = async (password: string) => {
    try {
      setWifiChooseListVisible(false);
      GlobalActivityIndicatorManager.current?.show(
        `正在连接${currentSelectedWifi.current}中...`,
        0
      );

      await WifiManager.connectToProtectedSSID(currentSelectedWifi.current, password, true, false);

      GlobalSnackbarManager.current?.show({
        content: '连接成功',
      });

      // 重新连接socket
      handleConnectToSocketAgain();

      setRobotStatus({
        currentConnectWifiSSID: currentSelectedWifi.current,
      });
    } catch (error) {
      console.log(error);
      GlobalActivityIndicatorManager.current?.hide();
      GlobalSnackbarManager.current?.show({
        content: '连接失败,请检查密码是否正确或者当前Wi-Fi是否正常',
      });
    }
  };

  return (
    <View
      className="flex w-full flex-col items-end justify-between px-6 pt-5"
      style={{ paddingTop: top + 15 }}>
      <View className="flex w-full flex-row items-center justify-between">
        <Image
          source={require('@/assets/hkcrc.png')}
          style={{ width: 250, height: 26.39 }}
          contentFit="contain"
          transition={1000}
        />
        {renderBatteryIcon()}
      </View>

      <Portal>
        <Modal
          visible={wifiChooseListVisible}
          onDismiss={() => setWifiChooseListVisible(false)}
          contentContainerStyle={{
            backgroundColor: 'white',
            borderRadius: 15,
            paddingHorizontal: 20,
            paddingVertical: 20,
            marginHorizontal: 'auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: width / 3,
          }}>
          <View className="w-full">
            <View className="mb-5 flex flex-row items-center justify-between">
              <View className="flex flex-row items-center justify-center">
                <Icon source="cog" size={22} />
                <Text className="mb-1 ml-2 text-2xl font-bold">选择WiFi</Text>
              </View>

              <TouchableOpacity onPress={handleRefreshWifiList}>
                <Icon source="refresh" size={22} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={wifiList.length > 0 ? wifiList : []}
              keyExtractor={(item) => item.SSID + item.BSSID}
              renderItem={({ item }) => {
                return (
                  <TouchableOpacity className="my-1 flex flex-row items-center justify-between gap-2 rounded-lg bg-gray-200 px-5 py-3.5">
                    <View className="flex flex-row items-center justify-center">
                      <Icon source="wifi" size={20} />
                      <Text className="text-md ml-2 text-gray-800">{item.SSID}</Text>
                      {savedWifiPasswords[item.SSID] && (
                        <View style={{ marginLeft: 5 }}>
                          <Icon source="content-save" size={16} color="#4CAF50" />
                        </View>
                      )}
                    </View>
                    {robotStatus.currentConnectWifiSSID === item.SSID ? (
                      <Text className="text-md text-gray-800">已连接</Text>
                    ) : (
                      <TouchableOpacity
                        className="rounded-full bg-white px-3 py-1"
                        onPress={() => handleWifiSelect(item.SSID)}>
                        <Text className="text-md text-gray-800">连接</Text>
                      </TouchableOpacity>
                    )}
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={
                <View className="mb-5 flex flex-row items-center justify-center gap-2 gap-y-2">
                  <Icon source="wifi-off" size={16} />
                  <Text className="text-gray-800">没有可连接的WiFi</Text>
                </View>
              }
            />
          </View>
        </Modal>

        {/* 使用已保存密码的确认对话框 */}
        <Dialog
          visible={savedPasswordDialogVisible}
          style={{ width: '80%', left: '0%', right: '0%', marginHorizontal: 'auto' }}
          onDismiss={() => setSavedPasswordDialogVisible(false)}>
          <Dialog.Title>使用保存的密码连接 {currentSelectedWifi.current}?</Dialog.Title>
          <Dialog.Content>
            <Text>使用保存的密码连接 {currentSelectedWifi.current}?</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              onPress={() => {
                setSavedPasswordDialogVisible(false);
                setWifiPasswordDialogVisible(true);
              }}>
              使用新密码连接
            </Button>
            <Button onPress={connectWithSavedPassword}>使用保存的密码连接</Button>
          </Dialog.Actions>
        </Dialog>

        {/* 输入Wi-Fi密码对话框 */}
        <Dialog
          visible={wifiPasswordDialogVisible}
          style={{ width: '80%', left: '0%', right: '0%', marginHorizontal: 'auto' }}
          onDismiss={() => setWifiPasswordDialogVisible(false)}>
          <Dialog.Title>输入WiFi密码 {currentSelectedWifi.current}</Dialog.Title>
          <Dialog.Content>
            <TextInput
              placeholder="输入WiFi密码"
              value={wifiPassword}
              onChangeText={setWifiPassword}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={hideWifiPasswordDialog}>取消</Button>
            <Button onPress={connectWithNewPassword}>连接</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <View className="mb-1 mt-5 flex flex-row items-center gap-5">
        {!isLoginPage ? (
          <TouchableOpacity
            className="flex flex-row items-center gap-2 rounded-full bg-white p-3 px-4"
            onPress={openWifiSetting}>
            <WifiHigh size={18} weight="bold" />
            <Text className="text-sm text-gray-800">
              {robotStatus.currentConnectWifiSSID ? robotStatus.currentConnectWifiSSID : 'WiFi'}
            </Text>
          </TouchableOpacity>
        ) : null}

        {!isLoginPage ? (
          <TouchableOpacity
            className="flex flex-row items-center gap-2 rounded-full bg-white p-3 px-4"
            onPress={gotoSetting}>
            <Gear size={18} weight="bold" />
            <Text className="text-sm text-gray-800">设置</Text>
          </TouchableOpacity>
        ) : null}

        {!isLoginPage ? (
          <Button
            icon={robotStatus.robotDangerStatus ? 'pause' : 'play'}
            mode="contained"
            buttonColor="red"
            onPress={handleForcePause}>
            软急停
          </Button>
        ) : null}
      </View>
    </View>
  );
};
