import { useAsyncStorage } from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';
import { Button, Card, Icon, TextInput } from 'react-native-paper';

import { Header } from '@/components/header';
import { storage_config } from '@/constants';
import useStore from '@/store';

export default function Setting() {
  const { canLoginInfo } = useStore((state) => state);
  const userInfo = useAsyncStorage(storage_config.LOCAL_STORAGE_USER_INFO);
  const goback = () => {
    router.back();
  };

  const logout = async () => {
    await userInfo.removeItem();
    router.dismissAll();
    router.replace('/(root)/(login)');
  };

  return (
    <View className="flex w-full">
      <Header />

      <View className="flex w-full flex-row items-center justify-between px-20 py-10">
        <View className="w-[45%] items-center justify-center">
          <Image
            source={require('@/assets/images/p3.png')}
            contentFit="contain"
            style={{
              width: 300,
              height: 300,
            }}
          />
        </View>

        <View className="w-[50%] ">
          <Card className="px-5 py-6">
            <View className="flex flex-row items-center justify-center">
              <View className="mb-2 flex flex-row items-center justify-center">
                <Icon source="account-circle-outline" size={22} />
                <Text className="-top-[1px] ml-2 text-center text-2xl font-bold">用户信息</Text>
              </View>
            </View>
            <ScrollView className="h-72 lg:h-96">
              <View className="gap-5">
                <TextInput
                  label="用户名"
                  value={canLoginInfo.name}
                  disabled
                  style={{ backgroundColor: '#01264142' }}
                  keyboardType="numeric"
                />

                <TextInput
                  label="用户ID"
                  value={canLoginInfo.id.toString()}
                  disabled
                  style={{ backgroundColor: '#01264142' }}
                />

                <TextInput
                  label="公司地址"
                  value={canLoginInfo.position}
                  disabled
                  style={{ backgroundColor: '#01264142' }}
                />

                <TextInput
                  label="公司名称"
                  value={canLoginInfo.company}
                  disabled
                  style={{ backgroundColor: '#01264142' }}
                />

                <TextInput
                  label="联系电话"
                  value={canLoginInfo.number}
                  disabled
                  style={{ backgroundColor: '#01264142' }}
                />
              </View>
            </ScrollView>

            <View className="mt-5 flex flex-row items-center justify-center gap-10">
              <Button mode="contained" icon="logout" className="px-3" onPress={logout}>
                退出登录
              </Button>

              <Button mode="outlined" icon="arrow-left" className="px-3" onPress={goback}>
                返回
              </Button>
            </View>
          </Card>
        </View>
      </View>
    </View>
  );
}
