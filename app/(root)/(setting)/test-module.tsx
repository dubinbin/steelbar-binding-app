import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View, FlatList } from 'react-native';
import { Button, Card, Text } from 'react-native-paper';

import { Header } from '@/components/header';
import { Command } from '@/constants/command';
import useStore from '@/store';
import { parserBackBoardData, sendCmdDispatch } from '@/utils/helper';

// 自定义日志渲染组件
const LogItem = ({ item }: { item: { time: string; msg: string } }) => {
  const { msg, time } = item;

  // 检查是否是特定格式的数据（包含 "-----start-----" 和 "end"）
  const isFormattedData = msg.includes('-----start-----') && msg.includes('-----end-----');

  if (isFormattedData) {
    // 解析格式化数据
    const lines = msg.split('\n').filter((line) => line.trim());
    const title = lines[0]?.split(':')[0] || '数据';
    const dataLines = lines.slice(1, -1); // 去掉第一行和最后一行

    return (
      <View className="mb-3">
        <Text style={{ color: 'white', fontSize: 16, marginBottom: 3 }}>
          {new Date(time).toLocaleString()}: {title}
        </Text>
        <View className="rounded-lg border border-gray-500 bg-gray-900 p-3">
          {dataLines.map((line, index) => {
            const trimmedLine = line.trim();
            if (trimmedLine.includes(':')) {
              const [key, value] = trimmedLine.split(':').map((s) => s.trim());
              return (
                <View key={index} className="mb-1 flex-row items-center">
                  <Text style={{ color: '#87CEEB', fontSize: 14, flex: 1 }}>{key}:</Text>
                  <Text
                    style={{ color: '#98FB98', fontSize: 14, width: 60 }}
                    className="rounded-md border-[0.5px] border-gray-500 px-2 py-1 text-center text-xs">
                    {value.replace(',', '')}
                  </Text>
                </View>
              );
            }
            return (
              <Text key={index} style={{ color: 'white', fontSize: 14, marginBottom: 1 }}>
                {trimmedLine}
              </Text>
            );
          })}
        </View>
      </View>
    );
  }

  // 普通日志显示
  return (
    <Text style={{ color: 'white', fontSize: 16, marginBottom: 3 }}>
      {new Date(time).toLocaleString()}: {msg}
    </Text>
  );
};

export default function TestModule() {
  const router = useRouter();
  const { debugLog, clearDebugLog, logStatus, setLogStatus, setDebugLog } = useStore(
    (state) => state
  );
  const [isFullscreen, setIsFullscreen] = useState(false);

  const goback = () => {
    router.back();
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const openDebugMode = () => {
    sendCmdDispatch(Command.wifiTest);
  };

  const openDebugCommand = (command: Command) => {
    switch (command) {
      case Command.sliderLeftTest:
        sendCmdDispatch(Command.sliderLeftTest);
        // setDebugLog({
        //   time: new Date().toISOString(),
        //   msg: `收到后板数据: ${parserBackBoardData(`rebarLaser:0,motorTault:0,ultrasonValue:0,motorState:0,right:0,left:0,edge:0`)}`,
        // });
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

      <View className="flex min-h-[72%] w-full flex-row px-5">
        <Card className="mb-5 mr-5 w-[43%]" style={{ display: isFullscreen ? 'none' : 'flex' }}>
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

              <Button
                mode="text"
                className="mx-1 mb-4 text-sm"
                onPress={() => openDebugCommand(Command.GunTrigger)}>
                枪绑扎 (GunTrigger)
              </Button>

              <Button
                mode="text"
                className="mx-1 mb-4 text-sm"
                onPress={() => openDebugCommand(Command.GunReboot)}>
                枪重启 (GunReboot)
              </Button>
            </View>
          </Card.Content>
        </Card>

        <View className="flex-1" style={{ width: isFullscreen ? '90%' : 'auto' }}>
          <FlatList
            data={debugLog}
            className="m-2 mb-3 flex-1 rounded-lg bg-black p-2"
            renderItem={({ item }) => <LogItem item={item} />}
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
            <Button
              mode="outlined"
              icon={isFullscreen ? 'fullscreen-exit' : 'fullscreen'}
              className="px-3"
              onPress={toggleFullscreen}>
              {isFullscreen ? '退出全屏' : '全屏'}
            </Button>
          </View>
        </View>
      </View>

      <View className="flex w-full flex-row justify-center gap-4">
        <Button mode="outlined" className="mx-5 my-2" onPress={toggleFullscreen}>
          {isFullscreen ? '退出全屏' : '进入全屏'}
        </Button>

        <Button mode="outlined" className="mx-5 my-2" onPress={goback}>
          返回
        </Button>
      </View>
    </View>
  );
}
