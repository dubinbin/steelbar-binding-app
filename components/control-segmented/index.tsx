import { View } from 'react-native';
import { SegmentedButtons } from 'react-native-paper';

import { Command } from '@/constants/command';
import useStore from '@/store';
import { ROBOT_CURRENT_MODE, ROBOT_WORK_MODE } from '@/types';
import { sendCmdDispatch } from '@/utils/helper';

export const ControlSegmented = () => {
  const { robotStatus, setRobotStatus } = useStore((state) => state);

  const sendCmd = (mode: ROBOT_CURRENT_MODE) => {
    if (mode === ROBOT_CURRENT_MODE.LOCKED) {
      sendCmdDispatch(Command.lockUp);
    } else if (mode === ROBOT_CURRENT_MODE.MANUAL) {
      sendCmdDispatch(Command.manualModel);
    } else if (mode === ROBOT_CURRENT_MODE.AUTO) {
      sendCmdDispatch(Command.autoModel);
    }
  };

  return (
    <View className="mb-10 mt-4 w-full gap-y-5">
      <SegmentedButtons
        value={robotStatus.currentMode}
        density="medium"
        onValueChange={(value) => {
          sendCmd(value as ROBOT_CURRENT_MODE);
          setRobotStatus({
            currentMode: value as ROBOT_CURRENT_MODE,
          });
        }}
        buttons={[
          {
            value: ROBOT_CURRENT_MODE.LOCKED,
            label: '锁止',
            icon: 'lock',
            checkedColor: '#ffffff',
            style: {
              backgroundColor:
                robotStatus.currentMode === ROBOT_CURRENT_MODE.LOCKED ? '#012641' : 'transparent',
            },
          },
          {
            value: ROBOT_CURRENT_MODE.MANUAL,
            label: '手动',
            icon: 'camera-control',
            checkedColor: '#ffffff',
            style: {
              backgroundColor:
                robotStatus.currentMode === ROBOT_CURRENT_MODE.MANUAL ? '#012641' : 'transparent',
            },
          },
          {
            value: ROBOT_CURRENT_MODE.AUTO,
            label: '自动',
            icon: 'robot-mower-outline',
            checkedColor: '#ffffff',
            style: {
              backgroundColor:
                robotStatus.currentMode === ROBOT_CURRENT_MODE.AUTO ? '#012641' : 'transparent',
            },
          },
        ]}
      />
      {robotStatus.currentMode === ROBOT_CURRENT_MODE.AUTO ? (
        <SegmentedButtons
          value={robotStatus.currentBindingMode}
          density="medium"
          onValueChange={(value) => {
            setRobotStatus({
              currentBindingMode: value as ROBOT_WORK_MODE,
            });
          }}
          buttons={[
            {
              value: ROBOT_WORK_MODE.WITHOUT_BINDING,
              label: '不扎',
              icon: 'not-equal-variant',
              checkedColor: '#ffffff',
              style: {
                backgroundColor:
                  robotStatus.currentBindingMode === ROBOT_WORK_MODE.WITHOUT_BINDING
                    ? '#012641'
                    : 'transparent',
              },
            },
            {
              value: ROBOT_WORK_MODE.FULL_BINDING,
              label: '满扎',
              icon: 'transit-connection',
              checkedColor: '#ffffff',
              style: {
                backgroundColor:
                  robotStatus.currentBindingMode === ROBOT_WORK_MODE.FULL_BINDING
                    ? '#012641'
                    : 'transparent',
              },
            },
            {
              value: ROBOT_WORK_MODE.SKIP_BINDING,
              label: '跳扎',
              icon: 'transit-skip',
              checkedColor: '#ffffff',
              style: {
                backgroundColor:
                  robotStatus.currentBindingMode === ROBOT_WORK_MODE.SKIP_BINDING
                    ? '#012641'
                    : 'transparent',
              },
            },
          ]}
        />
      ) : null}
    </View>
  );
};
