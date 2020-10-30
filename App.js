import 'react-native-gesture-handler';
import React from 'react';
import { Dimensions, Text, TouchableOpacity, View, Modal, TextInput} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import * as SQLite from 'expo-sqlite';
import * as FS from 'expo-file-system';
import * as ML from 'expo-media-library';
import * as Permissions from 'expo-permissions';

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
      dbShops: [],
      dbItems: [],
      shops : [],
      items: [],
      selectedShopItems: [],
    }
  }

  clean = () => {
    db.transaction(
      tx => {
        tx.executeSql('DROP TABLE SHOPS', [], () => console.log('Deleted all entries from shops'), (_, err) => console.log('error deleting entries: ' + err))
        tx.executeSql('DROP TABLE ITEMS', [], () => console.log('Deleted all entries from items'), (_, err) => console.log('error deleting entries: ' + err))
      },
      (error) => {
        console.log('error :' + error);
      },
      () => {
        console.log('success: clean successful');
      }
    )
  }
  componentDidMount() {
    //this.clean();
    (async () => {
      await Permissions.askAsync(Permissions.CAMERA_ROLL);
    })()
    this.createTables();
    let data = [];
    db.transaction(
      tx => {
        tx.executeSql(`SELECT shop_id as id, name as title FROM SHOPS`, [], (_, {rows}) => {
          let ids = [], shopItems = [];
          rows._array.map(row => {
            ids.push(row.id);
            shopItems.push({shopId: row.id, shopItems: []});
          });
          data = ids;
          this.setState({shops: rows._array, dbShops: ids});
          tx.executeSql(`SELECT item_id as itemId, shop_id as shopId FROM ITEMS`, [], (_, {rows}) => {
            let dbItems = [];
            rows._array.map(row => {
              let shopItem = shopItems.find(item => item.shopId == row.shopId);
              dbItems.push(row.itemId);
              data.map(item => {
                if(row.shopId == item) {
                  shopItem.shopItems.push({id: row.itemId, title: row.itemId});
                }
              })
            });
            this.setState({items: shopItems, dbItems: dbItems});
          }, {})
        }, {})
      },
      (error) => {
        console.log('error :' + error);
      },
      () => {
        console.log('success: query items successful');
      }
    )
  }

  insertShop = (id, name) => {
    db.transaction(
      tx => {
        tx.executeSql('INSERT INTO SHOPS(shop_id, name) VALUES(?, ?)', [parseInt(id), name], {}, {});
      },
      (error) => {
        alert('Unexpected error happened : ' + error);
      },
      () => {
        alert('Successfully updated shops');
      }
    )
  }

  save = () => {
    const {items} = this.state;
    items.map(item => {
      (async ()=> {
        const file = FS.cacheDirectory + `shopId_${item.shopId}.csv`;
        let data = '';
        item.shopItems.map(shopItem => {
          data += shopItem.id + ',\n';
        });
        await FS.deleteAsync(file, {idempotent: true});
        await FS.writeAsStringAsync(file, data);
        const asset = await ML.createAssetAsync(file);
        await ML.createAlbumAsync("Download", asset, false);
      })()
    });
    alert('File(s) saved successfully')
  }

  createTables = () => {
    db.transaction(
      tx => {
        tx.executeSql('CREATE TABLE IF NOT EXISTS SHOPS(shop_id integer primary key not null, name text)', [], {}, {})
        tx.executeSql('CREATE TABLE IF NOT EXISTS ITEMS(item_id integer not null, shop_id integer, Foreign key(shop_id) references SHOPS(shop_id))', [], {}, {})
      },
      (error) => {
        console.log('error :' + error);
      },
      () => {
        db.exec([{ sql: 'PRAGMA foreign_keys = ON;', args: [] }], false, () => console.log('Foreign keys turned on'));
        console.log('successfully created tables');
      }
    )
  }

  deleteShop = (id) => {
    const {shops} = this.state;
    db.transaction(
      tx => {
        tx.executeSql(`DELETE FROM ITEMS WHERE shop_id = ?`, [id], {}, {})
        tx.executeSql(`DELETE FROM SHOPS WHERE shop_id = ?`, [id], {}, {})
      },
      (error) => {
        console.log('error :' + error);
      },
      () => {
        alert('Shop Deleted Successfully');
      }
    )
    this.setState({...this.state, shops: shops.filter(item => item.id != id)})
  }

  showItemsInShop = (navigation, id) => {
    let data = [];
    db.transaction(
      tx => {
        tx.executeSql(`SELECT DISTINCT item_id as id FROM ITEMS WHERE shop_id = ?`, [id], (_, {rows}) => {
          data = rows._array.map(item => ({id: item.id, title: item.id}));
          this.setState({...this.state, selectedShopId: id, selectedShopItems: data})
          navigation.navigate('Items', {});
        }, {})
      },
      (error) => {
        console.log('error :' + error);
      },
      () => {
        console.log(`Shop ${id} items fetched Successfully`);
      }
    )
  }

  setSelectedShopsItems = (newItems) => {
    const {selectedShopItems, items, selectedShopId} = this.state;
    const newShopItems = [...selectedShopItems, ...newItems.map(item => ({id: item, title: item}))];
    const updatedItems = items.map(item => {
      if (item.shopId === selectedShopId)
        item.shopItems = newShopItems
      return item
    })
    this.setState({...this.state, selectedShopItems: newShopItems ,items: updatedItems})
    newShopItems.map(item => {
      db.transaction(
        tx => {
          tx.executeSql(`INSERT INTO ITEMS(item_id, shop_id) VALUES(?, ?)`, [parseInt(item.id), selectedShopId], {}, {});
        },
        (error) => {
          console.log('error :' + error);
        },
        () => {
          console.log('Successfully inserted items');
        }
      )
    })
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
          {(props) => <ListView {...props} data={shops} press= {this.showItemsInShop} save={this.save} deleteShop={this.deleteShop} />}
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
                            if (shopId != "" && shopName != "") {
                              if (!shops.some(shop => shop.id === shopId)) {
                                this.insertShop(shopId, shopName);
                                this.setState({modalVisible: false, shopId: '', shopName: '', shops: [...shops, {id: shopId, title: shopName}]});
                              } else {
                                alert('Shop Id already present');
                              }
                            } else {
                              this.setState({modalVisible: false});
                            }
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