import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import { Text, TouchableOpacity, View } from 'react-native';
import { TouchableRipple } from 'react-native-paper';

import { ChangeState } from '@/constants';
import { Command } from '@/constants/command';
import useStore from '@/store';
import { DIRECTION } from '@/types';
import { debounce, sendCmdDispatch, sendCmdWithRepeat } from '@/utils/helper';
import { showNotifier } from '@/utils/notifier';

export const ControlManualControl = () => {
  const { robotStatus } = useStore((state) => state);
  const { t } = useTranslation();
  // 为什么不用switch 因为似乎switch对于里面再定义复杂逻辑会提示不能重复定义let/const等逻辑
  const switchLeftOrRight = debounce((direction: DIRECTION) => {
    if (direction === DIRECTION.LEFT) {
      // 左右移动要等变轨完成
      if (robotStatus.changeState === ChangeState.finish) {
        sendCmdDispatch(Command.goLeft);
      } else {
        showNotifier({
          title: t('common.changingOrbitTips'),
          type: 'error',
          duration: 3000,
          onPress: () => {},
        });
      }
    } else if (direction === DIRECTION.RIGHT) {
      if (robotStatus.changeState === ChangeState.finish) {
        sendCmdDispatch(Command.goRight);
      }
    }
  }, 400);

  const switchTop = (isPressed: boolean) => {
    if (isPressed) {
      sendCmdDispatch(Command.goForward);
    } else {
      sendCmdWithRepeat(() => {
        sendCmdDispatch(Command.release);
      });
    }
  };

  const switchDown = (isPressed: boolean) => {
    if (isPressed) {
      sendCmdDispatch(Command.goBack);
    } else {
      sendCmdWithRepeat(() => {
        sendCmdDispatch(Command.release);
      });
    }
  };

  return (
    <View className="relative mt-1.5 flex h-[180px] w-[150px] flex-row items-center justify-center gap-x-5">
      <View className="absolute left-0 top-0 h-full w-full flex-col items-center justify-center gap-y-10">
        <TouchableRipple
          onPressIn={() => switchTop(true)}
          onPressOut={() => switchTop(false)}
          centered
          style={{ top: -32 }}
          className="rounded-full px-2 py-2"
          borderless
          rippleColor="rgba(0, 0, 0, .32)">
          <Image
            source={require('@/assets/icon/top-arrow.png')}
            style={{ width: 50, height: 50 }}
          />
        </TouchableRipple>
        <TouchableRipple
          onPressIn={() => switchDown(true)}
          onPressOut={() => switchDown(false)}
          centered
          style={{ top: 32 }}
          className="rounded-full px-2 py-2"
          borderless
          rippleColor="rgba(0, 0, 0, .32)">
          <Image
            source={require('@/assets/icon/down-arrow.png')}
            style={{ width: 50, height: 50 }}
          />
        </TouchableRipple>
      </View>

      <TouchableOpacity className="flex rounded-full">
        <Image
          source={require('@/assets/direction_tags.png')}
          style={{ width: 100, height: 100 }}
        />
      </TouchableOpacity>

      <View className="absolute left-0 top-0 h-full w-full flex-row items-center justify-center gap-x-10">
        <TouchableRipple
          onPress={() => switchLeftOrRight(DIRECTION.LEFT)}
          centered
          style={{ left: -40 }}
          className="rounded-full px-2 py-2"
          borderless
          rippleColor="rgba(0, 0, 0, .32)">
          <Image
            source={require('@/assets/icon/left-arrow.png')}
            style={{ width: 50, height: 50 }}
          />
        </TouchableRipple>
        <TouchableRipple
          onPress={() => switchLeftOrRight(DIRECTION.RIGHT)}
          centered
          borderless
          style={{ left: 40 }}
          className="rounded-full px-2 py-2"
          rippleColor="rgba(0, 0, 0, .32)">
          <Image
            source={require('@/assets/icon/right-arrow.png')}
            style={{ width: 50, height: 50 }}
          />
        </TouchableRipple>
      </View>
    </View>
  );
};
