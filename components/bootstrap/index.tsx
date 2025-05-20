import { useAsyncStorage } from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';

import { GlobalActivityIndicatorManager } from '../activity-indicator-global';
import { GlobalSnackbarManager } from '../snackbar-global';
import { EventHandler } from './event';

import { GlobalConst, storage_config } from '@/constants';
import { Command } from '@/constants/command';
import { eventBusKey } from '@/constants/event';
import database from '@/model/manager';
import useStore from '@/store';
import { ConnectDeviceInfo } from '@/utils/connectDeviceInfo';
import eventBus from '@/utils/eventBus';
import { delayed, globalGetConnect } from '@/utils/helper';
import { SocketManage } from '@/utils/socketManage';

// 这个组件主要做一些初始化功能
export const Bootstrap = () => {
  const userInfo = useAsyncStorage(storage_config.LOCAL_STORAGE_USER_INFO);
  const { setCanLoginInfo, canLoginInfo, robotStatus, setRobotStatus } = useStore((state) => state);

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

  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    switch (nextAppState) {
      // active 相当于 Flutter 中的 resumed - 应用在前台可见且活跃
      case 'active':
        console.log('return to app');
        restartConnect(); // 重连wifi
        break;

      // background 相当于 Flutter 中的 paused - 应用在后台运行
      case 'background':
        // TODO: 处理应用进入后台
        break;

      // inactive 应用正在切换状态时(如接电话、切换应用时)
      case 'inactive':
        // TODO: 处理应用不活跃状态
        break;

      default:
        break;
    }
  };

  const restartConnect = async () => {
    if (!ConnectDeviceInfo.connectStatus) {
      GlobalActivityIndicatorManager.current?.show('等待重新连接...', 0);

      await delayed(2000);

      globalGetConnect();

      GlobalActivityIndicatorManager.current?.hide();
    }
  };

  const sendCmd = (cmd: Command) => {
    if (robotStatus.robotDangerStatus) {
      GlobalSnackbarManager.current?.show({
        content: '机器人处于软急停状态，无法发送命令',
      });
      return;
    }
    const socket = SocketManage.getInstance();

    if (socket.isConnected()) {
      socket.writeData(`${GlobalConst.forwardCmd}${cmd}`);
    } else {
      GlobalSnackbarManager.current?.show({
        content: '机器人未连接，无法发送命令',
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
