import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { MainTabsParamList } from '../@types/navigation';
import { CustomBottomTab } from '../components/layout/CustomBottomTab';
import { DashboardScreen } from '../screens/main/DashboardScreen';
import { PlanningScreen } from '../screens/main/PlanningScreen';
import { ReportsScreen } from '../screens/main/ReportsScreen';
import { TransactionsScreen } from '../screens/main/TransactionsScreen';

const Tab = createBottomTabNavigator<MainTabsParamList>();

export const MainTabs: React.FC = () => {
  return (
    <Tab.Navigator
      initialRouteName="Dashboard"
      tabBar={(props) => <CustomBottomTab {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Planning" component={PlanningScreen} />
      <Tab.Screen name="Reports" component={ReportsScreen} />
      <Tab.Screen name="Transactions" component={TransactionsScreen} />
    </Tab.Navigator>
  );
};

export default MainTabs;
