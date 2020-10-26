import React, {useState, useEffect} from 'react';
import { Text, View, FlatList, TouchableOpacity, Dimensions, StyleSheet } from 'react-native';


const styles = StyleSheet.create({
    scrollView: {
        width: Dimensions.get('window').width,
        height: 5*Dimensions.get('window').height/6,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      },
    listStyles: { 
        marginTop: 10,
        color: 'yellow',
    },
    title: {
        color: 'grey',
    },
    button: {
        height: 50,
        width: 100,
        borderWidth: 1,
        alignItems: "center",
        backgroundColor: "#DDDDDD",
        margin: 10,
        padding: 10,
    },
    listItem: {
        padding: 20,
        width: 250,
        marginVertical: 8,
        marginHorizontal: 16,
        backgroundColor: "transparent",
        borderColor: 'grey',
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    deleteIcon: {
        borderWidth: 1,
        borderColor: 'red',
        height: 22,
        width: 22,
        borderRadius: 11,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
}) 

const ListView = ({navigation, route: {params}, data, press, deleteShop}) => {
    const [selectedShop, setSelectedShop] = useState('');
    const [items, setItems] = useState([]);
    const {showDelete} = params;
    if (!press) {
        press = () => {}
    }

    useEffect(() => {
        setItems(data);
    }, [data])

    return (
        <View
        style={{
          flex: 1,
          display: 'flex',
          width: Dimensions.get('window').width,
          flexDirection: 'column',
          padding: 0,
          margin: 0,
          backgroundColor: 'rgb(30, 30, 31)',
          alignItems: 'center',
          justifyContent: 'center',
        }}>

        <FlatList
            data={items}
            renderItem={({item}) => 
                <TouchableOpacity onPress={() => {setSelectedShop(item.id); press(navigation, item.id)}}  style={styles.listItem}>
                    <Text style={styles.title}>{item.title.length > 25 ? item.title.substring(0, 25) + '...' : item.title}</Text>
                    {
                        showDelete ? 
                        <TouchableOpacity onPress={ () => deleteShop(item.id)} style={styles.deleteIcon}><Text style={{color: 'red', fontSize: 10}}>X</Text></TouchableOpacity>:
                        null
                    }
                </TouchableOpacity>
            }
        />
      </View>
    )
}

export default ListView;