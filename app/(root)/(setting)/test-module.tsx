import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, FlatList } from 'react-native';
import { Button, Card, Text, Modal, Portal } from 'react-native-paper';

import { Header } from '@/components/header';
import { Command } from '@/constants/command';
import { eventBusKey } from '@/constants/event';
import useStore from '@/store';
import eventBus from '@/utils/eventBus';
import { sendCmdDispatch } from '@/utils/helper';
import { showNotifier } from '@/utils/notifier';

export default function TestModule() {
  const router = useRouter();
  const [logVisible, setLogVisible] = useState(false);
  const { debugLog, clearDebugLog } = useStore((state) => state);
  const goback = () => {
    router.back();
  };

  const seeLog = () => {
    setLogVisible(true);
  };

  useEffect(() => {
    eventBus.subscribe(eventBusKey.BackBoardEvent, ({ eBackBoard }: { eBackBoard: string }) => {
      showNotifier({
        title: `BackBoard: ${eBackBoard}`,
        type: 'info',
        duration: 5000,
        onPress: () => {},
      });
    });

    eventBus.subscribe(eventBusKey.FrontBoardEvent, ({ eFrontBoard }: { eFrontBoard: string }) => {
      showNotifier({
        title: `FrontBoard: ${eFrontBoard}`,
        type: 'info',
        duration: 5000,
        onPress: () => {},
      });
    });

    eventBus.subscribe(eventBusKey.MksEvent, ({ eMks }: { eMks: string }) => {
      showNotifier({
        title: `Mks: ${eMks}`,
        type: 'info',
        duration: 5000,
        onPress: () => {},
      });
    });

    return () => {
      eventBus.unsubscribe(eventBusKey.BackBoardEvent, () => {});
      eventBus.unsubscribe(eventBusKey.FrontBoardEvent, () => {});
      eventBus.unsubscribe(eventBusKey.MksEvent, () => {});
    };
  }, []);

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
      <Portal>
        <Modal
          visible={logVisible}
          onDismiss={() => setLogVisible(false)}
          contentContainerStyle={{
            backgroundColor: 'white',
            padding: 20,
            borderRadius: 10,
            width: '90%',
            marginHorizontal: 'auto',
            height: '80%',
          }}>
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
            <Button
              mode="outlined"
              icon="close"
              className="px-3"
              onPress={() => setLogVisible(false)}>
              关闭
            </Button>

            <Button
              mode="outlined"
              icon="close"
              className="px-3"
              onPress={() => {
                setLogVisible(false);
                clearDebugLog();
              }}>
              清空
            </Button>
          </View>
        </Modal>
      </Portal>

      <View className="flex w-full px-20 py-10">
        <Button
          mode="contained"
          icon="debug-step-out"
          className="mb-4 px-3"
          onPress={openDebugMode}>
          打开测试模式(WIFICONTROLTEST)
        </Button>

        <Card className="mb-5">
          <Card.Content>
            <View className="mx-5 flex flex-row flex-wrap">
              <Button
                mode="outlined"
                className="mx-1 mb-4 w-1/4"
                onPress={() => openDebugCommand(Command.sliderLeftTest)}>
                横移 左(SliderLeftTest)
              </Button>

              <Button
                mode="outlined"
                className="mx-1 mb-4 w-1/4"
                onPress={() => openDebugCommand(Command.sliderRightTest)}>
                横移 右(SliderRightTest)
              </Button>

              <Button
                mode="outlined"
                className="mx-1 mb-4 w-1/3"
                onPress={() => openDebugCommand(Command.holdDownTest)}>
                支撑杆 下 (HoldDownTest)
              </Button>

              <Button
                mode="outlined"
                className="mx-1 mb-4 w-1/3"
                onPress={() => openDebugCommand(Command.holdUpTest)}>
                支撑杆 上下 (HoldUpTest)
              </Button>

              <Button
                mode="outlined"
                className="mx-1 mb-4 w-1/3"
                onPress={() => openDebugCommand(Command.legsDownTest)}>
                辅助腿、杆 下 (LegsDownTest)
              </Button>

              <Button
                mode="outlined"
                className="mx-1 mb-4 w-1/3"
                onPress={() => openDebugCommand(Command.legsUpTest)}>
                辅助腿、杆 上 (LegsUpTest)
              </Button>

              <Button
                mode="outlined"
                className="mx-1 mb-4 w-1/4"
                onPress={() => openDebugCommand(Command.gunDownTest)}>
                枪 下 (GunDownTest)
              </Button>

              <Button
                mode="outlined"
                className="mx-1 mb-4 w-1/4"
                onPress={() => openDebugCommand(Command.gunUpTest)}>
                枪 上 (GunUpTest)
              </Button>

              <Button
                mode="outlined"
                className="mx-1 mb-4 w-1/3"
                onPress={() => openDebugCommand(Command.lunForward)}>
                轮子前进 (LunForward)
              </Button>

              <Button
                mode="outlined"
                className="mx-1 mb-4 w-1/3"
                onPress={() => openDebugCommand(Command.lunBackward)}>
                轮子后退 (LunBackward)
              </Button>

              <Button
                mode="outlined"
                className="mx-1 mb-4 w-1/4"
                onPress={() => openDebugCommand(Command.lunStop)}>
                轮子停止 (LunStop)
              </Button>
            </View>
          </Card.Content>
        </Card>

        <View className="flex w-full flex-row justify-center gap-4">
          <Button mode="outlined" icon="file-document-outline" className="px-3" onPress={seeLog}>
            日志
          </Button>
          <Button mode="outlined" icon="arrow-left" className="px-3" onPress={goback}>
            返回
          </Button>
        </View>
      </View>
    </View>
  );
}
