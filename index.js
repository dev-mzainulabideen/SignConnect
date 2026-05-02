/**
 * @format
 */

import 'react-native-reanimated';
import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

console.log('App starting...', appName);

AppRegistry.registerComponent(appName, () => App);
