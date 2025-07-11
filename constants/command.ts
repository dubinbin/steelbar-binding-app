export enum Command {
  lockUp = 0, // 锁止
  goForward = 1, // 前进
  goBack = 2, // 后退
  goLeft = 3, // 向左变轨
  goRight = 4, // 向右变轨
  manualModel = 5, // 手动模式
  autoModel = 6, // 自动模式
  noLashed = 7, // 不扎
  allLashed = 8, // 满扎
  jumpLashed = 9, // 跳扎
  lashedReboot = 10, // 绑扎抢重启
  machineReboot = 11, // 机器人复位
  machineDescent = 12, // 机器人下降
  softStop = 13, // 软急停
  release = 14, // 释放前后移动按钮
  loginSuccess = 15, // 登录成功命令
  // 无线控制测试指令
  wifiTest = 18, // 无线控制测试
  sliderLeftTest = 19, //横移 左
  sliderRightTest = 20, //横移 右
  holdDownTest = 21, //支撑杆 下
  holdUpTest = 22, //支撑杆 上
  legsDownTest = 23, //辅助腿、杆 下
  legsUpTest = 24, //辅助腿、杆 上
  gunDownTest = 25, //枪 下
  gunUpTest = 26, //枪 上
  lunForward = 27, //轮子前进
  lunBackward = 28, //轮子后退
  lunStop = 29, //轮子停止
}
