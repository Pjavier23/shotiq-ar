import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import HomeScreen from './screens/HomeScreen';
import SessionScreen from './screens/SessionScreen';
import SummaryScreen from './screens/SummaryScreen';
import WorkoutScreen from './screens/WorkoutScreen';

export type Screen = 'home' | 'session' | 'summary' | 'workout';

export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [sessionData, setSessionData] = useState<any>(null);

  const navigate = (s: Screen, data?: any) => {
    if (data) setSessionData(data);
    setScreen(s);
  };

  return (
    <>
      <StatusBar style="light" />
      {screen === 'home' && <HomeScreen navigate={navigate} />}
      {screen === 'session' && <SessionScreen navigate={navigate} />}
      {screen === 'summary' && <SummaryScreen navigate={navigate} sessionData={sessionData} />}
      {screen === 'workout' && <WorkoutScreen navigate={navigate} />}
    </>
  );
}
