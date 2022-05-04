import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Entypo } from '@expo/vector-icons';
import Recorder from './components/Recorder';
import Player from './components/Player';

const Tab = createBottomTabNavigator();

export default function App() {


  return (
    <NavigationContainer>
      <Tab.Navigator>
        <Tab.Screen name="Recorder" component={Recorder}
          options={{
            tabBarLabel: 'Recorder',
            tabBarIcon: (tabInfo) => (
              <Entypo name="controller-record"
                size={24}
                color={tabInfo.focused ? "red" : "grey"} />
            ),
          }} />
        <Tab.Screen name="Player" component={Player}
          options={{
            tabBarLabel: 'Player',
            tabBarIcon: (tabInfo) => (
              <Entypo name="controller-play"
                size={24}
                color={tabInfo.focused ? "green" : "grey"} />
            )
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}


