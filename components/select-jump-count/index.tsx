import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { RadioButton } from 'react-native-paper';

import useStore from '@/store';
const jumpCountList = [
  {
    value: '1',
    label: '1',
  },
  {
    value: '2',
    label: '2',
  },
  {
    value: '3',
    label: '3',
  },
  {
    value: '4',
    label: '4',
  },
];

export const SelectJumpCount = () => {
  const [checked, setChecked] = useState('1');
  const { setRobotStatus } = useStore((state) => state);
  const { t } = useTranslation();
  const handleChange = (value: string) => {
    setChecked(value);
    setRobotStatus({
      skip_binding_count: parseInt(value, 10),
    });
  };

  return (
    <View className="-mt-6 flex flex-col items-start justify-center">
      <Text className="text-center text-lg font-bold">{t('common.currentSkipBindingCount')}</Text>
      <View className="flex flex-col items-center justify-center">
        {jumpCountList.map((item) => (
          <View key={item.value} className="flex flex-row items-center justify-center gap-x-1">
            <RadioButton.Android
              value={item.value}
              onPress={() => handleChange(item.value)}
              status={checked === item.value ? 'checked' : 'unchecked'}
            />
            <Text className="text-lg">{item.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};
