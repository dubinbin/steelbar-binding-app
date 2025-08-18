import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import { Text, TouchableOpacity, View } from 'react-native';

import { Button, TouchableRipple } from 'react-native-paper';

import { ChangeState } from '@/constants';
import { Command } from '@/constants/command';
import useStore from '@/store';
import { DIRECTION } from '@/types';
import { debounce, sendCmdDispatch } from '@/utils/helper';

interface ControlAutoSelectDirectionProps {
  onStart: () => void;
  onStop: () => void;
}

export const ControlAutoSelectDirection = ({
  onStart,
  onStop,
}: ControlAutoSelectDirectionProps) => {
  const { robotStatus } = useStore((state) => state);
  const { t } = useTranslation();

  const switchLeftOrRight = debounce((direction: DIRECTION) => {
    if (direction === DIRECTION.LEFT) {
      // 左右移动要等变轨完成
      if (robotStatus.changeState === ChangeState.finish) {
        sendCmdDispatch(Command.LeftChange);
      }
    } else if (direction === DIRECTION.RIGHT) {
      if (robotStatus.changeState === ChangeState.finish) {
        sendCmdDispatch(Command.RightChange);
      }
    }
  }, 400);

  const switchTop = (isPressed: boolean) => {
    if (isPressed) {
      sendCmdDispatch(Command.goForwardInAutoMode);
    } else {
      sendCmdDispatch(Command.release);
    }
  };

  const switchDown = (isPressed: boolean) => {
    if (isPressed) {
      sendCmdDispatch(Command.goBackInAutoMode);
    } else {
      sendCmdDispatch(Command.release);
    }
  };

  return (
    <View className="relative mt-16 flex flex-row items-center justify-center gap-x-5">
      <View className="absolute left-0 top-0 h-full w-full flex-row items-center justify-center gap-x-10">
        <Button
          mode="contained-tonal"
          buttonColor="#012641"
          textColor="#ffffff"
          style={{ top: -80, left: -50 }}
          onPress={() => {
            onStart();
          }}>
          开始
        </Button>

        <Button
          mode="contained-tonal"
          buttonColor="#FD1D1DD5"
          textColor="#ffffff"
          style={{ top: -80, right: -50 }}
          onPress={() => {
            onStop();
          }}>
          停止
        </Button>
      </View>

      <View className="absolute left-0 top-0 h-full w-full flex-col items-center justify-center gap-y-10">
        <TouchableRipple
          onPress={() => switchTop(true)}
          centered
          style={{ top: -30 }}
          className="rounded-full px-2 py-2"
          borderless
          rippleColor="rgba(0, 0, 0, .32)">
          <Image
            source={require('@/assets/icon/top-arrow.png')}
            style={{ width: 50, height: 50 }}
          />
        </TouchableRipple>
        <TouchableRipple
          onPress={() => switchDown(true)}
          centered
          style={{ top: 30 }}
          className="rounded-full px-2 py-2"
          borderless
          rippleColor="rgba(0, 0, 0, .32)">
          <Image
            source={require('@/assets/icon/down-arrow.png')}
            style={{ width: 50, height: 50 }}
          />
        </TouchableRipple>
      </View>

      {/*  */}
      <View
        // onPress={handlePlay}
        className="relative flex w-full flex-row items-center justify-center opacity-0">
        <View className="flex">
          {robotStatus.isWorking ? (
            <View className="flex h-[80px] w-[80px] flex-row items-center justify-center rounded-full bg-[#012641]">
              {/* <Icon source="pause" color="#ffffff" size={22} /> */}
              <Text className="ml-1 text-center text-xl font-normal text-white">
                {t('common.pause')}
              </Text>
            </View>
          ) : (
            <View className="flex h-[80px] w-[80px] flex-row items-center justify-center rounded-full bg-[#012641]">
              {/* <Icon source="play" color="#ffffff" size={22} /> */}
              <Text className="ml-1 text-center text-xl font-normal text-white">
                {t('common.start')}
              </Text>
            </View>
          )}
        </View>
      </View>

      <TouchableOpacity className="absolute -bottom-2 flex rounded-full">
        <Image source={require('@/assets/direction_tags.png')} style={{ width: 90, height: 90 }} />
      </TouchableOpacity>

      <View className="absolute left-0 top-0 h-full w-full flex-row items-center justify-center gap-x-10">
        <TouchableRipple
          onPress={() => switchLeftOrRight(DIRECTION.LEFT)}
          centered
          style={{ left: -30 }}
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
          style={{ left: 30 }}
          className="rounded-full px-2 py-2"
          borderless
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
