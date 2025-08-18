import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dimensions, Text, View } from 'react-native';
import { Button, Card, Icon } from 'react-native-paper';

import { ControlAutoSelectDirection } from '../control-auto-select-direction';
import { ControlExtraModule } from '../control-extra-module';
import { ControlManualControl } from '../control-manual-control';
import { ControlSegmented } from '../control-segmented';

import { Command } from '@/constants/command';
import useStore from '@/store';
import { ROBOT_CURRENT_MODE } from '@/types';
import { sendCmdDispatch } from '@/utils/helper';
import { showNotifier } from '@/utils/notifier';

export const LockMode = () => {
  const { t } = useTranslation();
  return (
    <View className="flex h-[180px] w-[150px] flex-row items-center justify-center gap-x-2">
      <Icon source="lock" size={22} />
      <Text className="text-center text-xl font-normal text-black">{t('common.lockMode')}</Text>
    </View>
  );
};

export const ControlBar = () => {
  const { robotStatus, workParams, setRobotStatus } = useStore((state) => state);
  const [showMore, setShowMore] = useState(false);
  const { t } = useTranslation();
  const { height } = Dimensions.get('window');

  // 点击开始
  const startTyping = () => {
    if (workParams.auto_find_point) {
      showNotifier({
        title: t('robot.autoFindPointTips'),
        type: 'error',
        duration: 3000,
        onPress: () => {},
      });
      return;
    }

    if (!robotStatus.isWorking) {
      sendCmdDispatch(Command.BeginAutoMode);
    } else {
      sendCmdDispatch(Command.manualModel);
      setRobotStatus({
        isWorking: false,
      });
    }
  };

  const stopTyping = () => {
    sendCmdDispatch(Command.EndAutoMode);
  };

  const renderControl = () => {
    if (robotStatus.currentMode === ROBOT_CURRENT_MODE.LOCKED) {
      return <LockMode />;
    } else if (robotStatus.currentMode === ROBOT_CURRENT_MODE.MANUAL) {
      return <ControlManualControl />;
    } else {
      return <ControlAutoSelectDirection onStart={startTyping} onStop={stopTyping} />;
    }
  };

  return (
    <Card className="relative pb-8">
      <View className="flex h-full w-full flex-col justify-between px-8 pt-2">
        <View className="mb-5 flex flex-col items-center">
          <View className="mb-2 mt-3 flex flex-row items-center justify-center">
            <Icon source="robot-happy-outline" size={22} />
            <Text className="ml-2 text-center text-2xl font-bold">
              {t('common.robotOperation')}
            </Text>
          </View>
          <ControlSegmented />

          {renderControl()}
        </View>

        {height > 700 ? (
          <View className="flex w-full flex-row justify-end gap-x-5">
            <ControlExtraModule />
          </View>
        ) : (
          <View className="absolute bottom-0 right-5 flex w-full flex-row justify-end gap-x-5">
            {showMore ? (
              <View className="rounded-xl border border-gray-300 bg-white px-5 pb-16 pt-10">
                <Button
                  className="absolute right-0 top-1"
                  mode="text"
                  icon="chevron-down"
                  onPress={() => setShowMore(false)}>
                  <Text className="text-lg font-normal">{t('common.collapse')}</Text>
                </Button>
                <ControlExtraModule />
              </View>
            ) : (
              <Button
                mode="elevated"
                icon="dots-horizontal"
                className="absolute bottom-0 right-0"
                onPress={() => {
                  setShowMore(!showMore);
                }}>
                <Text>{t('common.moreFeatures')}</Text>
              </Button>
            )}
          </View>
        )}
      </View>
    </Card>
  );
};
