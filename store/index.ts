import { create } from 'zustand';

import { ChangeState, DownState, RebootState, workParamsRange } from '@/constants';
import { DIRECTION, ROBOT_CURRENT_MODE, ROBOT_WORK_MODE } from '@/types';

interface State {
  canLoginInfo: {
    company: string;
    id: number;
    name: string;
    number: string;
    password: string;
    position: string;
  };
  setCanLoginInfo: (newInfo: { [key: string]: any }) => void;
  robotStatus: {
    robotDangerStatus: boolean;
    direction: Map<DIRECTION, boolean>;
    currentMode: ROBOT_CURRENT_MODE;
    currentBindingMode: ROBOT_WORK_MODE | '';
    isWorking: boolean;
    skip_binding_count: number;
    downState: DownState;
    rebootState: RebootState;
    changeState: ChangeState;
    electric: number;
  };
  setRobotStatus: (newInfo: Partial<State['robotStatus']>) => void;
  userInfo: {
    username: string;
    password: string;
  };
  setUserInfo: (newInfo: { [key: string]: any }) => void;
  workParams: {
    track_laser_range: string;
    node_laser_range: string;
    upper_layer_diameter: string;
    lower_layer_diameter: string;
    lower_steel_bar_length: string;
    binding_timeout: string;
    ultrasonic_waves: boolean;
    prevent_falling_laser: boolean;
    auto_find_point: boolean;
    inputOrbitMax: number;
    inputNodeMax: number;
  };
  data_inspect: {
    overage_num: number;
    node_laser_num: number;
    track_laser_num: number;
  };
  setWorkParams: (newInfo: Partial<State['workParams']>) => void;
  errorGroup: {
    time: string;
    errorId: number;
  }[];
  setDataInspect: (newInfo: Partial<State['data_inspect']>) => void;
  setErrorGroup: (newInfo: { time: string; errorId: number }) => void;
}

export const initWorkParams = {
  track_laser_range: '104.5', // 变轨激光初始值
  node_laser_range: '74.5', // 节点激光初始值
  upper_layer_diameter: '20', // 上层钢筋直径初始值
  lower_layer_diameter: '22', // 下层钢筋直径初始值
  lower_steel_bar_length: '22', // 下层钢筋长度初始值
  binding_timeout: '20', // 绑扎超时时间初始值
  ultrasonic_waves: true, // 超声波初始值
  prevent_falling_laser: true, // 防坠落激光初始值
  auto_find_point: false, // 自动寻点开关初始值
  inputOrbitMax: workParamsRange.orbitMax, // 变轨激光最大值
  inputNodeMax: workParamsRange.nodeMax, // 节点激光最大值
};

export const useStore = create<State>((set) => ({
  robotStatus: {
    electric: 100, // 电量
    robotDangerStatus: false, // 软急停状态
    direction: new Map([
      // 前进方向
      [DIRECTION.UP, false],
      [DIRECTION.DOWN, false],
      [DIRECTION.LEFT, false],
      [DIRECTION.RIGHT, false],
    ]),
    currentMode: ROBOT_CURRENT_MODE.LOCKED, // 当前模式
    currentBindingMode: '', // 当前绑扎模式
    isWorking: false, // 机器人是否在工作
    skip_binding_count: 1, // 默认跳扎数
    downState: DownState.finish, // 机器人下降状态
    rebootState: RebootState.finish, // 机器复位状态
    changeState: ChangeState.finish, // 机器变轨状态
  },
  data_inspect: {
    overage_num: 0, // 卷丝余量
    node_laser_num: 0, // 节点激光初始值
    track_laser_num: 0, // 变轨激光初始值
  },
  setDataInspect: (newInfo: { [key: string]: any }) =>
    set((state) => ({ data_inspect: { ...state.data_inspect, ...newInfo } })),
  // 一个写死的登录信息
  canLoginInfo: {
    company: 'HKCRC',
    id: 0,
    name: 'admin',
    number: '85223563130',
    password: 'hkcrc',
    position: 'HongKong',
  },
  setCanLoginInfo: (newInfo: { [key: string]: any }) =>
    set((state) => ({ canLoginInfo: { ...state.canLoginInfo, ...newInfo } })),
  setRobotStatus: (newInfo: { [key: string]: any }) =>
    set((state) => ({
      robotStatus: {
        ...state.robotStatus,
        ...newInfo,
      },
    })),
  userInfo: {
    username: '',
    password: '',
  },
  setUserInfo: (newInfo: { [key: string]: any }) =>
    set((state) => ({ userInfo: { ...state.userInfo, ...newInfo } })),
  workParams: {
    track_laser_range: '104.5', // 变轨激光初始值
    node_laser_range: '74.5', // 节点激光初始值
    upper_layer_diameter: '20', // 上层钢筋直径初始值
    lower_layer_diameter: '22', // 下层钢筋直径初始值
    lower_steel_bar_length: '22', // 下层钢筋长度初始值
    binding_timeout: '20', // 绑扎超时时间初始值
    ultrasonic_waves: true, // 超声波初始值
    prevent_falling_laser: true, // 防坠落激光初始值
    auto_find_point: false, // 自动寻点开关初始值
    inputOrbitMax: workParamsRange.orbitMax, // 变轨激光最大值
    inputNodeMax: workParamsRange.nodeMax, // 节点激光最大值
  },
  setWorkParams: (newInfo: { [key: string]: any }) =>
    set((state) => ({
      workParams: {
        ...state.workParams,
        ...newInfo,
      },
    })),
  errorGroup: [],
  setErrorGroup: (newInfo: { time: string; errorId: number }) =>
    set((state) => ({
      errorGroup: [newInfo, ...state.errorGroup],
    })),
}));

export default useStore;
