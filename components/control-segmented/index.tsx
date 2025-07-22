import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { SegmentedButtons } from 'react-native-paper';

import { Command } from '@/constants/command';
import useStore from '@/store';
import { ROBOT_CURRENT_MODE, ROBOT_WORK_MODE } from '@/types';
import { sendCmdDispatch } from '@/utils/helper';

export const ControlSegmented = () => {
  const { robotStatus, setRobotStatus } = useStore((state) => state);
  const { t } = useTranslation();
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
          if (value !== ROBOT_CURRENT_MODE.AUTO) {
            setRobotStatus({
              currentBindingMode: '',
            });
          }
        }}
        buttons={[
          {
            value: ROBOT_CURRENT_MODE.LOCKED,
            label: t('common.lock'),
            icon: 'lock',
            checkedColor: '#ffffff',
            style: {
              backgroundColor:
                robotStatus.currentMode === ROBOT_CURRENT_MODE.LOCKED ? '#012641' : 'transparent',
            },
          },
          {
            value: ROBOT_CURRENT_MODE.MANUAL,
            label: t('common.manual'),
            icon: 'camera-control',
            checkedColor: '#ffffff',
            style: {
              backgroundColor:
                robotStatus.currentMode === ROBOT_CURRENT_MODE.MANUAL ? '#012641' : 'transparent',
            },
          },
          {
            value: ROBOT_CURRENT_MODE.AUTO,
            label: t('common.auto'),
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
            if (value === ROBOT_WORK_MODE.WITHOUT_BINDING) {
              sendCmdDispatch(Command.noLashed);
            } else if (value === ROBOT_WORK_MODE.FULL_BINDING) {
              sendCmdDispatch(Command.allLashed);
            } else if (value === ROBOT_WORK_MODE.SKIP_BINDING) {
              sendCmdDispatch(Command.jumpLashed);
            }
          }}
          buttons={[
            {
              value: ROBOT_WORK_MODE.WITHOUT_BINDING,
              label: t('common.noLashed'),
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
              label: t('common.fullLashed'),
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
              label: t('common.skipLashed'),
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
