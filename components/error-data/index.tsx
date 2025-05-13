import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Dimensions, Text, View } from 'react-native';
import { Button, Card, DataTable, Icon } from 'react-native-paper';

import { useStore } from '@/store';
import { ConnectDeviceInfo } from '@/utils/connectDeviceInfo';

export const ErrorData = () => {
  const { height } = Dimensions.get('window');
  const targetHeight = height * 0.45;
  const rowCount = height > 600 ? Math.floor(targetHeight / 100) : 1;

  const { errorGroup } = useStore((state) => state);

  const [items, setItems] = useState<{ key: number; index: string; time: string; name: string }[]>(
    []
  );

  useEffect(() => {
    const temp = errorGroup?.map((item, index) => {
      return {
        key: index,
        index: item.errorId.toString(),
        time: item.time,
        name: ConnectDeviceInfo.errorInfo[item.errorId],
      };
    });
    setItems(temp || []);
  }, [errorGroup]);

  const openErrorDetailPage = () => {
    router.push('/(error_info)');
  };

  return (
    <Card>
      <View className="w-full px-5 pb-1 pt-2">
        <View className="mb-2 mt-3  flex flex-row items-center justify-center">
          <Icon source="alert-circle-outline" size={22} />
          <Text className="-top-[1px] ml-2 text-center text-2xl font-bold">故障监控</Text>
        </View>
        <DataTable>
          <DataTable.Header>
            <DataTable.Title>序号</DataTable.Title>
            <DataTable.Title>发生时间</DataTable.Title>
            <DataTable.Title numeric>故障名称</DataTable.Title>
          </DataTable.Header>

          {items.length > 0 ? (
            items.slice(0, rowCount).map((item) => (
              <DataTable.Row key={item.key}>
                <DataTable.Cell textStyle={{ textAlign: 'center', fontSize: 12 }}>
                  {item.index}
                </DataTable.Cell>
                <DataTable.Cell textStyle={{ textAlign: 'center', fontSize: 12 }}>
                  {item.time}
                </DataTable.Cell>
                <DataTable.Cell textStyle={{ textAlign: 'center', fontSize: 12 }} numeric>
                  {item.name}
                </DataTable.Cell>
              </DataTable.Row>
            ))
          ) : (
            <DataTable.Row>
              <DataTable.Cell textStyle={{ textAlign: 'center', fontSize: 12 }}>
                暂无数据
              </DataTable.Cell>
            </DataTable.Row>
          )}
        </DataTable>

        <View className="flex w-full items-end">
          <Button
            icon="eye"
            style={{ right: -10, marginTop: 10 }}
            mode="text"
            onPress={() => openErrorDetailPage()}>
            查看详情
          </Button>
        </View>
      </View>
    </Card>
  );
};
