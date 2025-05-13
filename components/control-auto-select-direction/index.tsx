import { Image } from 'expo-image';
import { Text, TouchableOpacity, View } from 'react-native';
// import { Icon } from 'react-native-paper';

// import { GlobalSnackbarManager } from '../snackbar-global';

import { ChangeState } from '@/constants';
import { Command } from '@/constants/command';
import useStore from '@/store';
import { DIRECTION } from '@/types';
import { sendCmdDispatch } from '@/utils/helper';

interface ControlAutoSelectDirectionProps {
  onStart: () => void;
}

export const ControlAutoSelectDirection = ({ onStart }: ControlAutoSelectDirectionProps) => {
  const { robotStatus } = useStore((state) => state);

  const handlePlay = () => {
    // let count = 0;
    // let mutualExclusion = false;
    // robotStatus.direction.forEach((val, direction) => {
    //   if (val) {
    //     count++;
    //   }
    //   if (
    //     direction === DIRECTION.UP &&
    //     val === true &&
    //     robotStatus.direction.get(DIRECTION.DOWN) === true
    //   ) {
    //     mutualExclusion = true;
    //   }

    //   if (
    //     direction === DIRECTION.LEFT &&
    //     val === true &&
    //     robotStatus.direction.get(DIRECTION.RIGHT) === true
    //   ) {
    //     mutualExclusion = true;
    //   }

    //   if (
    //     direction === DIRECTION.RIGHT &&
    //     val === true &&
    //     robotStatus.direction.get(DIRECTION.LEFT) === true
    //   ) {
    //     mutualExclusion = true;
    //   }

    //   if (
    //     direction === DIRECTION.DOWN &&
    //     val === true &&
    //     robotStatus.direction.get(DIRECTION.UP) === true
    //   ) {
    //     mutualExclusion = true;
    //   }
    // });

    // if (count === 0) {
    //   GlobalSnackbarManager.current?.show({
    //     content: '必须选择一个方向',
    //   });
    //   return;
    // }

    // if (count > 2) {
    //   GlobalSnackbarManager.current?.show({
    //     content: '你只能选择2个方向',
    //   });
    //   return;
    // }

    // if (mutualExclusion) {
    //   GlobalSnackbarManager.current?.show({
    //     content: '你只能选择2个不互斥的方向',
    //   });
    //   return;
    // }

    // 开始

    onStart();
  };

  const directionClick = (direction: DIRECTION) => {
    // setRobotStatus({
    //   direction: new Map(robotStatus.direction).set(
    //     direction,
    //     !robotStatus.direction.get(direction)
    //   ),
    // });
  };

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
    <View className="relative mt-12 flex flex-row items-center justify-center gap-x-5">
      <View className="absolute left-0 top-0 h-full w-full flex-col items-center justify-center gap-y-10">
        <TouchableOpacity
          className="-top-[30px]"
          onPressIn={() => switchTop(true)}
          onPressOut={() => switchTop(false)}>
          <Image
            source={require('@/assets/icon/top-arrow.png')}
            style={{ width: 50, height: 50 }}
          />
        </TouchableOpacity>
        <TouchableOpacity
          onPressIn={() => switchDown(true)}
          onPressOut={() => switchDown(false)}
          className="top-[30px]">
          <Image
            source={require('@/assets/icon/down-arrow.png')}
            style={{ width: 50, height: 50 }}
          />
        </TouchableOpacity>
      </View>

      {/*  */}
      <View
        // onPress={handlePlay}
        className="relative flex w-full flex-row items-center justify-center opacity-0">
        <View className="flex">
          {robotStatus.isWorking ? (
            <View className="flex h-[80px] w-[80px] flex-row items-center justify-center rounded-full bg-[#012641]">
              {/* <Icon source="pause" color="#ffffff" size={22} /> */}
              <Text className="ml-1 text-center text-xl font-normal text-white">暂停</Text>
            </View>
          ) : (
            <View className="flex h-[80px] w-[80px] flex-row items-center justify-center rounded-full bg-[#012641]">
              {/* <Icon source="play" color="#ffffff" size={22} /> */}
              <Text className="ml-1 text-center text-xl font-normal text-white">开始</Text>
            </View>
          )}
        </View>
      </View>

      <View className="absolute left-0 top-0 h-full w-full flex-row items-center justify-center gap-x-10">
        <TouchableOpacity
          onPress={() => switchLeftOrRight(DIRECTION.LEFT)}
          className="-left-[30px]">
          <Image
            source={require('@/assets/icon/left-arrow.png')}
            style={{ width: 50, height: 50 }}
          />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => switchLeftOrRight(DIRECTION.RIGHT)}
          className="-right-[30px]">
          <Image
            source={require('@/assets/icon/right-arrow.png')}
            style={{ width: 50, height: 50 }}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};
