import { Dimensions, View } from 'react-native';

import { ControlBar } from '@/components/control-bar';
import { DangerousStatus } from '@/components/dangerous-status';
import { DataInspect } from '@/components/data-inspect';
import { ErrorData } from '@/components/error-data';
import { Header } from '@/components/header';
import { StatusBox } from '@/components/status-box';
import useStore from '@/store';

const Home = () => {
  const { robotStatus } = useStore((state) => state);
  const { height } = Dimensions.get('window');
  const headerHeight = 120;

  return (
    <View className="flex w-full">
      <Header />
      {robotStatus.robotDangerStatus ? <DangerousStatus /> : null}

      <View
        style={{ height: height - headerHeight }}
        className="flex w-full flex-row justify-center px-6 py-5">
        <View className="w-[37%]">
          <View className="relative mx-auto flex w-[95%] flex-col justify-between gap-y-4">
            <View>
              <ErrorData />
            </View>
            <View>
              <DataInspect />
            </View>
          </View>
        </View>
        <View className="flex w-[26%]">
          <StatusBox />
        </View>
        <View className="flex h-[95%] w-[37%] flex-row">
          <View className="relative mx-auto flex w-[95%] flex-col justify-between gap-y-5">
            <ControlBar />
          </View>
        </View>
      </View>
    </View>
  );
};

export default Home;
