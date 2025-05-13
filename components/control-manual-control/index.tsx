import { Image } from 'expo-image';
import { Text, TouchableOpacity, View } from 'react-native';

import { ChangeState } from '@/constants';
import { Command } from '@/constants/command';
import useStore from '@/store';
import { DIRECTION } from '@/types';
import { sendCmdDispatch } from '@/utils/helper';

export const ControlManualControl = () => {
  const { robotStatus } = useStore((state) => state);

  // 为什么不用switch 因为似乎switch对于里面再定义复杂逻辑会提示不能重复定义let/const等逻辑
  const switchLeftOrRight = (direction: DIRECTION) => {
    if (direction === DIRECTION.LEFT) {
      // 左右移动要等变轨完成
      if (robotStatus.changeState === ChangeState.finish) {
        sendCmdDispatch(Command.goLeft);
      }
    } else if (direction === DIRECTION.RIGHT) {
      if (robotStatus.changeState === ChangeState.finish) {
        sendCmdDispatch(Command.goRight);
      }
    }
  };

  const switchTop = (isPressed: boolean) => {
    if (isPressed) {
      console.error('goForward');
      sendCmdDispatch(Command.goForward);
    } else {
      console.error('release');
      sendCmdDispatch(Command.release);
    }
  };

  const switchDown = (isPressed: boolean) => {
    if (isPressed) {
      console.error('goBack');
      sendCmdDispatch(Command.goBack);
    } else {
      console.error('release');
      sendCmdDispatch(Command.release);
    }
  };

  return (
    <View className="relative mt-1.5 flex h-[180px] w-[150px] flex-row items-center justify-center gap-x-5">
      <View className="absolute left-0 top-0 h-full w-full flex-col items-center justify-center gap-y-10">
        <TouchableOpacity onPressIn={() => switchTop(true)} onPressOut={() => switchTop(false)}>
          <Image
            source={require('@/assets/icon/top-arrow.png')}
            style={{ width: 50, height: 50, top: -32 }}
          />
        </TouchableOpacity>
        <TouchableOpacity onPressIn={() => switchDown(true)} onPressOut={() => switchDown(false)}>
          <Image
            source={require('@/assets/icon/down-arrow.png')}
            style={{ width: 50, height: 50, top: 32 }}
          />
        </TouchableOpacity>
      </View>

      {/* <TouchableOpacity onPress={tryTest} className="flex rounded-full bg-[#012641] px-5 py-5">
        <Text className="text-center text-lg text-white">试扎</Text>
      </TouchableOpacity> */}

      <View className="absolute left-0 top-0 h-full w-full flex-row items-center justify-center gap-x-10">
        <TouchableOpacity onPress={() => switchLeftOrRight(DIRECTION.LEFT)}>
          <Image
            source={require('@/assets/icon/left-arrow.png')}
            style={{ width: 50, height: 50, left: -40 }}
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => switchLeftOrRight(DIRECTION.RIGHT)}>
          <Image
            source={require('@/assets/icon/right-arrow.png')}
            style={{ width: 50, height: 50, left: 40 }}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};
