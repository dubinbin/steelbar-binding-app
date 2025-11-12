import { useAsyncStorage } from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AppState, AppStateStatus } from 'react-native';
import WifiManager from 'react-native-wifi-reborn';

import { GlobalActivityIndicatorManager } from '../activity-indicator-global';
import { EventHandler } from './event';
import { GlobalDialogManager } from '../global-dialog';

import { GlobalConst, storage_config } from '@/constants';
import { Command } from '@/constants/command';
import { eventBusKey } from '@/constants/event';
import database from '@/model/manager';
import useStore from '@/store';
import { ConnectDeviceInfo } from '@/utils/connectDeviceInfo';
import eventBus from '@/utils/eventBus';
import { delayed, globalGetConnect, sendCmdDispatch } from '@/utils/helper';
import { showNotifier } from '@/utils/notifier';
import { SocketManage } from '@/utils/socketManage';

// 这个组件主要做一些初始化功能
export const Bootstrap = () => {
  const userInfo = useAsyncStorage(storage_config.LOCAL_STORAGE_USER_INFO);
  const { setCanLoginInfo, canLoginInfo, robotStatus, setRobotStatus, setDebugLog } = useStore(
    (state) => state
  );
  const { t } = useTranslation();
  useEffect(() => {
    databaseInit();
    checkLogin();
    setTimeout(() => {
      globalGetConnect();
    }, 50);
  }, []);

  useEffect(() => {
    eventBus.subscribe(eventBusKey.SendCmdEvent, (cmd: Command) => {
      sendCmd(cmd);
    });

    eventBus.subscribe(eventBusKey.WifiEvent, (data: { eConnect: boolean }) => {
      setRobotStatus({
        wifiConnectStatus: data.eConnect,
      });
    });

    return () => {
      eventBus.unsubscribe(eventBusKey.SendCmdEvent, (cmd: Command) => {
        sendCmd(cmd);
      });

      eventBus.unsubscribe(eventBusKey.WifiEvent, (data: { eConnect: boolean }) => {
        setRobotStatus({
          wifiConnectStatus: data.eConnect,
        });
      });
    };
  }, []);

  useEffect(() => {
    const screenListener = AppState.addEventListener('change', handleAppStateChange);

    return () => screenListener.remove();
  }, []);

  useEffect(() => {
    eventBus.subscribe(eventBusKey.GunErrorEvent, () => {
      sendCmdDispatch(Command.lockUp);
      showNotifier({
        title: t('robot.gunError'),
        message: t('robot.gunErrorTips'),
        type: 'error',
        duration: 3000,
        onPress: () => {},
      });
    });

    return () => {
      eventBus.unsubscribe(eventBusKey.GunErrorEvent, () => {});
    };
  }, []);

  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    switch (nextAppState) {
      // active 相当于 Flutter 中的 resumed - 应用在前台可见且活跃
      case 'active':
        console.log('应用回到前台，恢复心跳和连接');
        // 恢复心跳
        // socket.resumeHeartbeat();
        // 检查连接状态并重连
        restartConnect();
        break;

      // background 相当于 Flutter 中的 paused - 应用在后台运行
      case 'background':
        console.log('应用进入后台，心跳在后台可能被暂停');
        // 注意：React Native 在后台时 setTimeout/setInterval 可能被暂停
        // 但 TCP socket 连接本身会保持
        break;

      // inactive 应用正在切换状态时(如接电话、切换应用时)
      case 'inactive':
        console.log('应用不活跃状态');
        break;

      default:
        break;
    }
  };

  const restartConnect = async () => {
    if (!ConnectDeviceInfo.connectStatus || !SocketManage.getInstance().isConnected()) {
      GlobalActivityIndicatorManager.current?.show(t('robot.waitingForReconnection'), 0);

      await delayed(2000);

      const store = useStore.getState();
      const { currentConnectWifiSSID, currentConnectWifiPassword } = store.robotStatus;
      if (
        currentConnectWifiSSID.indexOf(GlobalConst.wifiName) > -1 &&
        currentConnectWifiPassword !== ''
      ) {
        await WifiManager.connectToProtectedSSID(
          currentConnectWifiSSID,
          currentConnectWifiPassword,
          true,
          false
        );
      }

      globalGetConnect();

      GlobalActivityIndicatorManager.current?.hide();

      GlobalDialogManager.current?.show({
        title: t('wifi.connectDialogTips'),
        content: t('wifi.connectDialogTitle'),
        callback: () => {},
      });
    }
  };

  const sendCmd = (cmd: Command) => {
    if (robotStatus.robotDangerStatus) {
      showNotifier({
        title: t('errors.robotDangerStatusTips'),
        type: 'error',
        duration: 3000,
        onPress: () => {},
      });
      setDebugLog({
        time: new Date().toISOString(),
        msg: `发送命令失败，机器人处于软急停状态，无法发送命令: ${cmd} `,
      });
      return;
    }
    const socket = SocketManage.getInstance();
    if (socket.isConnected()) {
      socket.writeData(`${GlobalConst.forwardCmd}${cmd}`);
      setDebugLog({
        time: new Date().toISOString(),
        msg: `成功发送命令: ${cmd}`,
      });
    } else {
      showNotifier({
        title: t('errors.robotUnconnectedTips'),
        type: 'error',
        duration: 3000,
        onPress: () => {},
      });
      setDebugLog({
        time: new Date().toISOString(),
        msg: `发送命令失败，机器人未连接，无法发送命令: ${cmd} `,
      });
    }
  };

  const checkLogin = async () => {
    try {
      const getUserInfoFromStorage = await userInfo.getItem();
      if (!getUserInfoFromStorage || getUserInfoFromStorage === null) {
        router.replace('/(login)');
      }

      if (getUserInfoFromStorage && getUserInfoFromStorage !== '') {
        const parseJson = await JSON.parse(getUserInfoFromStorage || '{}');
        if (
          parseJson.id &&
          parseJson.username === canLoginInfo.name &&
          parseJson.password === canLoginInfo.password
        ) {
          console.log('登录成功');
        }
      }
    } catch (error) {
      console.log(error);
    }
  };

  const databaseInit = async () => {
    await database.init();
    await database.initDatabase();
    const userList = await database.getUser();
    if (userList.length > 0) {
      setCanLoginInfo(userList[0]);
    }
  };

  return <EventHandler />;
};
