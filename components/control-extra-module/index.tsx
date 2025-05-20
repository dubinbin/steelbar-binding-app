import { View } from 'react-native';
import { Button } from 'react-native-paper';

import { SelectJumpCount } from '../select-jump-count';
import { GlobalSnackbarManager } from '../snackbar-global';

import { DownState, RebootState } from '@/constants';
import { Command } from '@/constants/command';
import useStore, { initWorkParams } from '@/store';
import { ROBOT_CURRENT_MODE, ROBOT_WORK_MODE } from '@/types';
import { globalGetConnect, sendCmdDispatch } from '@/utils/helper';
import { SocketManage } from '@/utils/socketManage';

export const ControlExtraModule = () => {
  const { robotStatus, workParams, setWorkParams } = useStore((state) => state);

  const isInLockedMode = () => {
    if (robotStatus.currentMode === ROBOT_CURRENT_MODE.LOCKED) {
      GlobalSnackbarManager.current?.show({
        content: '锁止模式下，无法进行操作',
      });
      return true;
    }
    return false;
  };

  const robotReset = () => {
    if (isInLockedMode()) {
      return;
    }

    if (workParams.auto_find_point) {
      GlobalSnackbarManager.current?.show({
        content: '自动寻点模式下，无法进行复位',
      });
      return;
    }

    if (robotStatus.downState === DownState.finish) {
      sendCmdDispatch(Command.machineReboot);
      setWorkParams({
        ...initWorkParams,
      });
      SocketManage.getInstance().disconnectSocket();
      setTimeout(() => {
        globalGetConnect();
        // 10s后重新连接
      }, 10000);
    }
  };

  const robotDown = () => {
    if (isInLockedMode()) {
      return;
    }

    if (workParams.auto_find_point) {
      GlobalSnackbarManager.current?.show({
        content: '自动寻点模式下，无法进行机器人下降',
      });
      return;
    }
    sendCmdDispatch(Command.machineDescent);
  };

  const robotReboot = () => {
    if (isInLockedMode()) {
      return;
    }

    if (workParams.auto_find_point) {
      GlobalSnackbarManager.current?.show({
        content: '自动寻点模式下，无法进行绑扎机重启',
      });
      return;
    }
    if (robotStatus.rebootState === RebootState.finish) {
      sendCmdDispatch(Command.lashedReboot);
    }
  };

  return (
    <View className="relative flex w-full flex-row items-end justify-end">
      <View className="-bottom-[10px] flex gap-y-5">
        <Button icon="reload" mode="elevated" onPress={robotReboot}>
          绑扎机重启
        </Button>
        <Button icon="restart" mode="elevated" onPress={robotReset}>
          机器复位
        </Button>
        <Button icon="elevator-down" mode="elevated" onPress={robotDown}>
          机器下降
        </Button>
      </View>

      {robotStatus.currentMode === ROBOT_CURRENT_MODE.AUTO &&
      robotStatus.currentBindingMode === ROBOT_WORK_MODE.SKIP_BINDING ? (
        <View className="absolute left-0 top-0">
          <SelectJumpCount />
        </View>
      ) : null}
    </View>
  );
};
