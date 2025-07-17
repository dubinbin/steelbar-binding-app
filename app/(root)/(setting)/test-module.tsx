import { useRouter } from 'expo-router';
import { View, FlatList } from 'react-native';
import { Button, Card, Text } from 'react-native-paper';

import { Header } from '@/components/header';
import { Command } from '@/constants/command';
import useStore from '@/store';
import { sendCmdDispatch } from '@/utils/helper';

export default function TestModule() {
  const router = useRouter();
  const { debugLog, clearDebugLog, logStatus, setLogStatus } = useStore((state) => state);
  const goback = () => {
    router.back();
  };

  const openDebugMode = () => {
    sendCmdDispatch(Command.wifiTest);
  };

  const openDebugCommand = (command: Command) => {
    switch (command) {
      case Command.sliderLeftTest:
        sendCmdDispatch(Command.sliderLeftTest);
        break;
      case Command.sliderRightTest:
        sendCmdDispatch(Command.sliderRightTest);
        break;
      case Command.holdDownTest:
        sendCmdDispatch(Command.holdDownTest);
        break;
      case Command.holdUpTest:
        sendCmdDispatch(Command.holdUpTest);
        break;
      case Command.legsDownTest:
        sendCmdDispatch(Command.legsDownTest);
        break;
      case Command.legsUpTest:
        sendCmdDispatch(Command.legsUpTest);
        break;
      case Command.gunDownTest:
        sendCmdDispatch(Command.gunDownTest);
        break;
      case Command.gunUpTest:
        sendCmdDispatch(Command.gunUpTest);
        break;
      case Command.lunForward:
        sendCmdDispatch(Command.lunForward);
        break;
      case Command.lunBackward:
        sendCmdDispatch(Command.lunBackward);
        break;
      case Command.lunStop:
        sendCmdDispatch(Command.lunStop);
        break;
      default:
        break;
    }
  };

  return (
    <View className="flex w-full">
      <Header />

      <View className="flex w-full flex-row px-10">
        <Card className="mb-5 w-1/2">
          <Button
            mode="contained"
            icon="debug-step-out"
            className="mx-5 my-3"
            onPress={openDebugMode}>
            打开测试模式(WIFICONTROLTEST)
          </Button>

          <Card.Content>
            <View className=" flex flex-row flex-wrap">
              <Button
                mode="text"
                className="mx-1 mb-4 py-1 text-sm"
                onPress={() => openDebugCommand(Command.sliderLeftTest)}>
                横移 左(SliderLeftTest)
              </Button>

              <Button
                mode="text"
                className="mx-1 mb-4  text-sm"
                onPress={() => openDebugCommand(Command.sliderRightTest)}>
                横移 右(SliderRightTest)
              </Button>

              <Button
                mode="text"
                className="mx-1 mb-4  text-sm"
                onPress={() => openDebugCommand(Command.holdDownTest)}>
                支撑杆 下 (HoldDownTest)
              </Button>

              <Button
                mode="text"
                className="mx-1 mb-4  text-sm"
                onPress={() => openDebugCommand(Command.holdUpTest)}>
                支撑杆 上下 (HoldUpTest)
              </Button>

              <Button
                mode="text"
                className="mx-1 mb-4  text-sm"
                onPress={() => openDebugCommand(Command.legsDownTest)}>
                辅助腿、杆 下 (LegsDownTest)
              </Button>

              <Button
                mode="text"
                className="mx-1 mb-4  text-sm"
                onPress={() => openDebugCommand(Command.legsUpTest)}>
                辅助腿、杆 上 (LegsUpTest)
              </Button>

              <Button
                mode="text"
                className="mx-1 mb-4  text-sm"
                onPress={() => openDebugCommand(Command.gunDownTest)}>
                枪 下 (GunDownTest)
              </Button>

              <Button
                mode="text"
                className="mx-1 mb-4  text-sm"
                onPress={() => openDebugCommand(Command.gunUpTest)}>
                枪 上 (GunUpTest)
              </Button>

              <Button
                mode="text"
                className="mx-1 mb-4  text-sm"
                onPress={() => openDebugCommand(Command.lunForward)}>
                轮子前进 (LunForward)
              </Button>

              <Button
                mode="text"
                className="mx-1 mb-4  text-sm"
                onPress={() => openDebugCommand(Command.lunBackward)}>
                轮子后退 (LunBackward)
              </Button>

              <Button
                mode="text"
                className="mx-1 mb-4 text-sm"
                onPress={() => openDebugCommand(Command.lunStop)}>
                轮子停止 (LunStop)
              </Button>
            </View>
          </Card.Content>
        </Card>

        <View className="flex-1">
          <FlatList
            data={debugLog}
            className="m-2 mb-3 flex-1 rounded-lg bg-black p-2"
            renderItem={({ item }) => (
              <Text style={{ color: 'white', fontSize: 16, marginBottom: 3 }}>
                {new Date(item.time).toLocaleString()}: {item.msg}
              </Text>
            )}
            ItemSeparatorComponent={() => <View className="h-2" />}
            keyExtractor={(item, index) => `${item.time}-${index}`}
          />
          <View className="flex w-full flex-row justify-center gap-4">
            {logStatus === 'start' ? (
              <Button
                mode="outlined"
                icon="pause"
                className="px-3"
                onPress={() => setLogStatus('stop')}>
                暂停
              </Button>
            ) : (
              <Button
                mode="outlined"
                icon="play"
                className="px-3"
                onPress={() => setLogStatus('start')}>
                继续
              </Button>
            )}
            <Button
              mode="outlined"
              icon="close"
              className="px-3"
              onPress={() => {
                clearDebugLog();
              }}>
              清空
            </Button>
          </View>
        </View>
      </View>

      <Button mode="outlined" className="mx-5 my-2" onPress={goback}>
        返回
      </Button>
    </View>
  );
}
