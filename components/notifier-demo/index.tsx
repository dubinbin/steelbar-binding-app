import React from 'react';
import { View } from 'react-native';
import { Button } from 'react-native-paper';

import { showError, showInfo, showSuccess, showWarning } from '@/utils/notifier';

export const NotifierDemo = () => {
  const handleSuccessNotification = () => {
    showSuccess('操作成功', '您的操作已成功完成');
  };

  const handleErrorNotification = () => {
    showError('操作失败', '出现了一些错误，请重试');
  };

  const handleWarningNotification = () => {
    showWarning('注意', '请检查设备状态后再继续操作');
  };

  const handleInfoNotification = () => {
    showInfo('提示信息', '这是一条普通的信息提示');
  };

  const handleLongMessage = () => {
    showInfo(
      '这是一个很长的标题用来测试换行效果',
      '这是一条很长的消息内容，用来测试消息显示的效果，看看是否能够正确显示完整的内容并且样式保持良好。'
    );
  };

  const handlePersistentNotification = () => {
    showError('持续显示', '这条消息不会自动消失，需要手动关闭', 0);
  };

  return (
    <View className="gap-4 p-4">
      <Button
        mode="contained"
        onPress={handleSuccessNotification}
        style={{ backgroundColor: '#10B981' }}>
        显示成功通知
      </Button>

      <Button
        mode="contained"
        onPress={handleErrorNotification}
        style={{ backgroundColor: '#EF4444' }}>
        显示错误通知
      </Button>

      <Button
        mode="contained"
        onPress={handleWarningNotification}
        style={{ backgroundColor: '#F59E0B' }}>
        显示警告通知
      </Button>

      <Button
        mode="contained"
        onPress={handleInfoNotification}
        style={{ backgroundColor: '#3B82F6' }}>
        显示信息通知
      </Button>

      <Button mode="outlined" onPress={handleLongMessage}>
        长消息测试
      </Button>

      <Button mode="outlined" onPress={handlePersistentNotification}>
        持续显示通知
      </Button>
    </View>
  );
};
