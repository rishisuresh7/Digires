import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { Dimensions, Text, TouchableOpacity, View, Modal, TextInput} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import * as SQLite from 'expo-sqlite';

import ListView from './list-view.component';
import CodeScanner from './bar-code.component';
import { StatusBar } from 'expo-status-bar';

const db = SQLite.openDatabase('inventory', '1.0.0');
const Stack = createStackNavigator();

class App extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      shopId: '',
      shopName: '',
      selectedShopId: '',
      modalVisible: false,
      shops : [{id: '1', title: 'X'}, {id: '2', title: 'XY'}, {id: '3', title: 'XYZ'}, {id: '4', title: 'A'},],
      items: [{
        shopId: '1',
        shopItems: [{id: '1', title:'shop 1 item 1'}, {id: '2', title:'shop 1 item 2'}]
      },
      {
        shopId: '2',
        shopItems: [{id: '1', title:'shop 2 item 1'}]
      },
      {
        shopId: '3',
        shopItems: [{id: '1', title:'shop 3 item 1'}]
      }],
      selectedShopItems: [],
    }
  }

  deleteShop = (id) => {
    const {shops} = this.state;
    this.setState({...this.state, shops: shops.filter(item => item.id != id)})
  }

  showItemsInShop = (navigation, id) => {
    const item = this.state.items.find(item => item.shopId === id)
    this.setState({...this.state, selectedShopId: id, selectedShopItems: item && item.shopItems ? item.shopItems : []})
    navigation.navigate('Items', {});
  }

  setSelectedShopsItems = (newItems) => {
    const {selectedShopItems, items, selectedShopId} = this.state;
    const newShopItems = [...selectedShopItems, ...newItems.map(item => ({id: item, title: 'test-item'}))];
    const updatedItems = items.map(item => {
      if (item.shopId === selectedShopId)
        item.shopItems = newShopItems
      return item
    })
    this.setState({...this.state, selectedShopItems: newShopItems ,items: updatedItems})
  }

  render() {
    const {modalVisible, shopId, shopName, shops} = this.state;
    return(
    <NavigationContainer>
    <Stack.Navigator headerMode ="screen">
      <Stack.Screen name='Shops' options={{
          title: 'Shops',
          headerStyle: {
            height: 100,
            backgroundColor: 'rgb(30, 30, 30)',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontSize: 25,
            fontWeight: 'bold',
          },
          header: ({scene: {route: {name}}}) => {
            return (
            <View style={{height: 100, display: 'flex', alignItems: 'center', flexDirection: 'row', backgroundColor: 'rgb(30, 30, 30)'}}>
              <View style={{height: 100,  width: 0.65 * Dimensions.get('window').width, display: 'flex', justifyContent: 'center', marginTop: 15, marginLeft: 10,}}>
                <Text style={{color: 'darkgrey', fontSize: 30, marginLeft: 20}}>{name}</Text>
              </View>
              <View style={{
                  height: 100,
                  width: 0.35 * Dimensions.get('window').width,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginTop: 15,
                  }}>
                  <TouchableOpacity onPress={ () => this.setState({...this.state, modalVisible: !modalVisible})} style={styles.deleteIcon}><Text style={{color: 'yellow', fontSize: 10}}>+</Text></TouchableOpacity>
              </View>
            </View>)
          },
        }}
        initialParams = {{ showDelete: true}}
        >
          {(props) => <ListView {...props} data={shops} press= {this.showItemsInShop} deleteShop={this.deleteShop} />}
        </Stack.Screen>
        <Stack.Screen name='Items' options={{
          title: 'Items',
          headerStyle: {
            backgroundColor: 'rgb(30, 30, 30)',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontSize: 25,
            fontWeight: 'bold',
          },
          header: ({navigation, scene: {route: {name}}}) => {
            return (
            <View style={{height: 100, display: 'flex', alignItems: 'center', flexDirection: 'row', backgroundColor: 'rgb(30, 30, 30)'}}>
              <View style={{height: 100,  width: 0.65 * Dimensions.get('window').width, display: 'flex', justifyContent: 'center', marginTop: 15, marginLeft: 10,}}>
                <Text style={{color: 'darkgrey', fontSize: 30, marginLeft: 20}}>{name}</Text>
              </View>
              <View style={{height: 100,
                  width: 0.35 * Dimensions.get('window').width,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginTop: 15,
                  }}>
                  <TouchableOpacity onPress={ () => navigation.navigate('CodeScanner')} style={styles.deleteIcon}><Text style={{color: 'white', fontSize: 10}}>+</Text></TouchableOpacity>
              </View>
            </View>)
          },
        }}
        >
          {props => <ListView {...props} data = {this.state.selectedShopItems}  />}
        </Stack.Screen>
        <Stack.Screen name='CodeScanner' options = {{
          title: 'Code Scanner',
          headerStyle: {
            backgroundColor: 'rgb(30, 30, 30)',
            },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontSize: 25,
            fontWeight: 'bold',
            },
          }}
        >
        {props => <CodeScanner {...props} setScannedItems = {this.setSelectedShopsItems} />}
        </Stack.Screen>
      </Stack.Navigator>
      <Modal
            animationType="slide"
            transparent={true}
            visible={this.state.modalVisible}
            >
            <View style={styles.centeredView}>
                <View style={styles.modalView}>
                    <Text style={{color: 'lightcyan', fontSize: 17, width: 250, textAlign: 'center'}} >Enter Shop Details</Text>
                    <TextInput
                        style={{ height: 40, width: 200, borderColor: 'gray', borderBottomWidth: 1, color: 'white', paddingTop: 15, }}
                        onChangeText={text => this.setState({...this.state, shopId: text})}
                        value={shopId}
                        placeholder= 'Shop Id'
                        placeholderTextColor='lightgrey'
                        keyboardAppearance='dark'
                        autoFocus={true}
                    />
                    <TextInput
                        style={{ height: 40, width: 200, borderColor: 'gray', borderBottomWidth: 1, color: 'white', paddingTop: 15, }}
                        onChangeText={text => this.setState({...this.state, shopName: text})}
                        value={shopName}
                        placeholder= 'Shop Name'
                        placeholderTextColor='lightgrey'
                    />
                    <TouchableOpacity
                        onPress={() => {
                            this.setState({modalVisible: false, shopId: '', shopName: '', shops: [...this.state.shops, {id: shopId, title: shopName}]});
                        }}>
                        <Text style={styles.textStyle}>Done</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
        <StatusBar style='light'></StatusBar>
    </NavigationContainer>
  )}
}

const styles = {
  deleteIcon: {
    borderWidth: 1,
    borderColor: 'yellow',
    height: 22,
    width: 22,
    borderRadius: 11,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
},
centeredView: {
  flex: 1,
  justifyContent: "center",
  alignItems: "center",
  marginTop: 22
},
modalView: {
  margin: 20,
  width: 250,
  height: 200,
  display: 'flex',
  backgroundColor: "rgb(51, 51, 51)",
  borderRadius: 20,
  padding: 35,
  alignItems: "center",
  justifyContent: 'space-between',
  shadowColor: "#000",
  shadowOffset: {
    width: 0,
    height: 2
  },
  shadowOpacity: 0.25,
  shadowRadius: 3.84,
  elevation: 5
},
textStyle: {
  color: "steelblue",
  textAlign: "center",
  paddingTop: 20,
}
}

export default App;