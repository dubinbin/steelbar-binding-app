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

  // WiFi缓存管理系统
  const [wifiCache, setWifiCache] = useState<{
    data: WifiEntry[];
    timestamp: number;
    source: 'system' | 'force' | 'background';
  } | null>(null);

  // 缓存配置 - 可自定义
  const CACHE_CONFIG = {
    SYSTEM_CACHE_DURATION: 30000, // 系统缓存30秒
    FORCE_CACHE_DURATION: 60000, // 强制扫描缓存1分钟
    BACKGROUND_CACHE_DURATION: 45000, // 后台缓存45秒
    MAX_CACHE_AGE: 120000, // 最大缓存时间2分钟
  };

  // 检查缓存是否有效
  const isCacheValid = (cacheTimestamp: number, maxAge: number): boolean => {
    return Date.now() - cacheTimestamp < maxAge;
  };

  // 获取缓存的WiFi数据
  const getCachedWifiData = (): WifiEntry[] | null => {
    if (!wifiCache) return null;

    const { data, timestamp, source } = wifiCache;
    let maxAge = CACHE_CONFIG.SYSTEM_CACHE_DURATION;

    // 根据数据源设置不同的缓存时间
    switch (source) {
      case 'force':
        maxAge = CACHE_CONFIG.FORCE_CACHE_DURATION;
        break;
      case 'background':
        maxAge = CACHE_CONFIG.BACKGROUND_CACHE_DURATION;
        break;
      case 'system':
      default:
        maxAge = CACHE_CONFIG.SYSTEM_CACHE_DURATION;
        break;
    }

    if (isCacheValid(timestamp, maxAge)) {
      console.log(
        `使用${source}缓存数据，剩余有效时间: ${Math.ceil((maxAge - (Date.now() - timestamp)) / 1000)}秒`
      );
      return data;
    }

    console.log(`${source}缓存已过期，需要重新获取`);
    return null;
  };

  // 更新WiFi缓存
  const updateWifiCache = (data: WifiEntry[], source: 'system' | 'force' | 'background') => {
    const newCache = {
      data,
      timestamp: Date.now(),
      source,
    };
    setWifiCache(newCache);
    console.log(`更新${source}缓存: ${data.length}个网络`);
  };

  // 清除过期缓存
  const clearExpiredCache = () => {
    if (wifiCache && !isCacheValid(wifiCache.timestamp, CACHE_CONFIG.MAX_CACHE_AGE)) {
      console.log('清除过期缓存');
      setWifiCache(null);
    }
  };

  // 定期清理过期缓存
  useEffect(() => {
    const cleanupInterval = setInterval(clearExpiredCache, 30000); // 每30秒检查一次
    return () => clearInterval(cleanupInterval);
  }, [wifiCache]);

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
    // 监听来自机器人的WiFi事件
    const handleWifiEvent = (data: { eConnect: boolean }) => {
      if (!data.eConnect) {
        setRobotStatus({
          currentConnectWifiSSID: '',
        });
      }
    };

    eventBus.subscribe(eventBusKey.WifiEvent, handleWifiEvent);

    return () => {
      eventBus.unsubscribe(eventBusKey.WifiEvent, handleWifiEvent);
    };
  }, []);

  // 定期检查WiFi连接状态
  useEffect(() => {
    let wifiCheckInterval: NodeJS.Timeout;

    const checkWifiStatus = async () => {
      try {
        const currentSSID = await WifiManager.getCurrentWifiSSID();
        const previousSSID = robotStatus.currentConnectWifiSSID;

        // 如果之前有连接的WiFi，但现在获取不到SSID，说明断联了
        if (previousSSID && (!currentSSID || currentSSID === '')) {
          console.log(`WiFi断联检测: 从 ${previousSSID} 断开`);
          handleWifiDisconnected(`WiFi "${previousSSID}" 连接断开`);
        }
        // 如果检测到WiFi变化（切换到其他WiFi）
        else if (currentSSID && previousSSID && currentSSID !== previousSSID) {
          console.log(`WiFi切换检测: 从 ${previousSSID} 切换到 ${currentSSID}`);
          setRobotStatus({
            currentConnectWifiSSID: currentSSID,
          });

          // 如果切换到的不是机器人WiFi，提示用户
          if (currentSSID.indexOf(GlobalConst.wifiName) === -1) {
            GlobalSnackbarManager.current?.show({
              content: `已切换到 ${currentSSID}，但这可能不是机器人WiFi`,
            });
          }
        }
        // 如果之前没有连接，现在检测到有连接
        else if (!previousSSID && currentSSID) {
          console.log(`WiFi连接检测: 连接到 ${currentSSID}`);
          setRobotStatus({
            currentConnectWifiSSID: currentSSID,
          });
        }
      } catch (error) {
        console.error('WiFi状态检查失败:', error);
      }
    };

    // 只在非登录页面启动定期检查
    if (!isLoginPage) {
      // 立即检查一次
      checkWifiStatus();

      // 每5秒检查一次WiFi状态
      wifiCheckInterval = setInterval(checkWifiStatus, 5000);
    }

    return () => {
      if (wifiCheckInterval) {
        clearInterval(wifiCheckInterval);
      }
    };
  }, [isLoginPage, robotStatus.currentConnectWifiSSID]);

  // 处理WiFi断联的统一逻辑
  const handleWifiDisconnected = (reason: string) => {
    const previousSSID = robotStatus.currentConnectWifiSSID;

    // 更新连接状态
    setRobotStatus({
      currentConnectWifiSSID: '',
    });

    // 清空WiFi列表，强制用户重新搜索
    setWifiList([]);

    // 显示断联提示
    GlobalSnackbarManager.current?.show({
      content: `${reason}，请重新连接WiFi`,
    });

    // 如果有之前连接的WiFi，记录日志
    if (previousSSID) {
      console.log(`WiFi断联处理: ${previousSSID} -> 断开连接 (原因: ${reason})`);
    }

    // 可选：自动尝试重连到之前的WiFi（如果有保存的密码）
    if (previousSSID && savedWifiPasswords[previousSSID]) {
      setTimeout(() => {
        GlobalSnackbarManager.current?.show({
          content: `检测到 ${previousSSID} 的保存密码，是否自动重连？`,
          action: '重连',
          actionCallback: () => autoReconnectWifi(previousSSID),
        });
      }, 2000);
    }
  };

  // 自动重连WiFi
  const autoReconnectWifi = async (ssid: string) => {
    try {
      const savedPassword = savedWifiPasswords[ssid];
      if (!savedPassword) {
        GlobalSnackbarManager.current?.show({
          content: '没有找到保存的密码',
        });
        return;
      }

      GlobalActivityIndicatorManager.current?.show(`正在自动重连 ${ssid}...`, 0);

      await WifiManager.connectToProtectedSSID(ssid, savedPassword, true, false);

      setRobotStatus({
        currentConnectWifiSSID: ssid,
      });

      GlobalActivityIndicatorManager.current?.hide();
      GlobalSnackbarManager.current?.show({
        content: `自动重连 ${ssid} 成功`,
      });

      // 重新连接socket
      handleConnectToSocketAgain();
    } catch (error) {
      console.error('自动重连失败:', error);
      GlobalActivityIndicatorManager.current?.hide();
      GlobalSnackbarManager.current?.show({
        content: `自动重连 ${ssid} 失败，请手动连接`,
      });
    }
  };

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
    try {
      // 检查WiFi权限
      await getWifiPermission();
      if (!wifiPermission) {
        GlobalSnackbarManager.current?.show({
          content: '需要WiFi权限才能搜索网络',
        });
        return;
      }

      setWifiChooseListVisible(true);

      // 使用缓存系统进行初始加载
      await handleRefreshWifiList('auto');
    } catch (error: any) {
      console.error('打开WiFi设置失败:', error?.message || 'Unknown error');
      GlobalSnackbarManager.current?.show({
        content: '打开WiFi设置失败，请重试',
      });
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

  // 智能WiFi扫描策略 - 使用可配置缓存
  const handleRefreshWifiList = async (type: 'auto' | 'manual' = 'auto') => {
    if (type === 'manual') {
      GlobalActivityIndicatorManager.current?.show('正在刷新WiFi列表...', 1000);
    }

    let loadWifiList: WifiEntry[] = [];
    let dataSource = '';

    try {
      if (type === 'auto') {
        // 自动模式：优先使用缓存
        const cachedData = getCachedWifiData();
        if (cachedData && cachedData.length > 0) {
          loadWifiList = cachedData;
          dataSource = `${wifiCache?.source}缓存`;
        } else {
          // 缓存无效，获取系统缓存
          console.log('缓存无效，获取系统数据');
          loadWifiList = await WifiManager.loadWifiList();
          dataSource = '系统数据';
          updateWifiCache(loadWifiList, 'system');
        }
      } else {
        // 手动模式：尝试强制扫描，失败则使用最佳缓存
        try {
          console.log('手动刷新：尝试强制扫描');
          loadWifiList = await WifiManager.reScanAndLoadWifiList();
          dataSource = '强制扫描';
          updateWifiCache(loadWifiList, 'force');
        } catch (error) {
          console.log('强制扫描失败，使用缓存数据:', error);

          // 强制扫描失败，使用最佳可用缓存
          const cachedData = getCachedWifiData();
          if (cachedData && cachedData.length > 0) {
            loadWifiList = cachedData;
            dataSource = `${wifiCache?.source}缓存(扫描失败)`;
          } else {
            // 没有有效缓存，尝试系统缓存
            loadWifiList = await WifiManager.loadWifiList();
            dataSource = '系统数据(扫描失败)';
            updateWifiCache(loadWifiList, 'system');
          }

          GlobalSnackbarManager.current?.show({
            content: `强制扫描失败，使用${dataSource}`,
          });
        }
      }

      console.log(`WiFi数据获取完成 (${dataSource}): ${loadWifiList.length}个网络`);

      // 处理和过滤WiFi数据
      const uniqueSSIDs = new Map();
      loadWifiList.forEach((wifi) => {
        if (
          wifi.SSID &&
          wifi.SSID !== '(hidden SSID)' &&
          wifi.SSID.indexOf(GlobalConst.wifiName) !== -1
        ) {
          const existing = uniqueSSIDs.get(wifi.SSID);
          if (!existing || wifi.level > existing.level) {
            uniqueSSIDs.set(wifi.SSID, wifi);
          }
        }
      });

      const filteredWifiList = Array.from(uniqueSSIDs.values())
        .sort((a, b) => b.level - a.level)
        .slice(0, 5);

      if (filteredWifiList.length > 0) {
        setWifiList(filteredWifiList);
        console.log(`显示 ${filteredWifiList.length} 个机器人WiFi (${dataSource})`);
      } else {
        setWifiList([]);
        if (type === 'manual') {
          GlobalSnackbarManager.current?.show({
            content: `未找到机器人WiFi，数据来源: ${dataSource}`,
          });
        }
      }
    } catch (error) {
      console.error('WiFi获取失败:', error);
      setWifiList([]);

      if (type === 'manual') {
        GlobalSnackbarManager.current?.show({
          content: 'WiFi获取失败，请检查权限设置',
        });
      }
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

              <TouchableOpacity onPress={() => handleRefreshWifiList('manual')}>
                <Icon source="refresh" size={22} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={wifiList}
              keyExtractor={(item) => item.BSSID}
              renderItem={({ item }) => (
                <TouchableOpacity
                  className="my-1 flex flex-row items-center justify-between gap-2 rounded-lg bg-gray-200 px-5 py-3.5"
                  onPress={() => handleWifiSelect(item.SSID)}>
                  <View className="flex flex-row items-center justify-center">
                    <Icon source="wifi" size={20} />
                    <Text className="text-md ml-2 text-gray-800">{item.SSID}</Text>
                    <Text className="ml-2 text-sm text-gray-600">({item.level}dBm)</Text>
                    {savedWifiPasswords[item.SSID] && (
                      <View style={{ marginLeft: 5 }}>
                        <Icon source="content-save" size={16} color="#4CAF50" />
                      </View>
                    )}
                  </View>
                  {robotStatus.currentConnectWifiSSID === item.SSID ? (
                    <Text className="text-md text-gray-800">已连接</Text>
                  ) : (
                    <Text className="text-md text-gray-800">连接</Text>
                  )}
                </TouchableOpacity>
              )}
              ListEmptyComponent={() => (
                <View className="mb-5 flex flex-col items-center justify-center gap-2 p-4">
                  <Icon source="wifi-off" size={24} />
                  <Text className="text-lg font-bold text-gray-800">未找到机器人WiFi</Text>
                </View>
              )}
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
