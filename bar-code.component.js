import React, {useEffect, useState} from 'react';
import { StyleSheet, Modal, Text, TouchableHighlight, View } from 'react-native';
import { BarCodeScanner } from 'expo-barcode-scanner';

const CodeScanner = () => {
    const [hasPermission, setHasPermission] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [scanned, setScanned] = useState(false);
    const [scannedData, setScannedData] = useState('');
    let items = [];

    useEffect(() => {
        (async () => {
          const { status } = await BarCodeScanner.requestPermissionsAsync()
          if(status != null && !hasPermission) {
            setHasPermission(status === 'granted');
          }
        })();
      }, []);

    const showItems = () => {
        console.log(items);
    }

    const handleBarCodeScanned = ({ data }) => {
        setScanned(true);
        if (!items.includes(data)) {
            items.push(data);
            setScannedData('Scanned : ' + data);
        } else {
            setScannedData('Item already present');
        }

        if (items.length > 3) {
            showItems();
        }
        setModalVisible(!modalVisible);
    };

    return (
        <React.Fragment>
            <BarCodeScanner
                style = {[StyleSheet.absoluteFillObject, {backgroundColor: 'rgb(30, 30, 30)'}]}
                onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
            />
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}>
                <View style={styles.centeredView}>
                    <View style={styles.modalView}>
                        <Text style={styles.modalText}>{scannedData}</Text>
                        <TouchableHighlight
                            style={{ ...styles.openButton, backgroundColor: "rgb(55, 55, 61)" }}
                                onPress={() => {
                                setScanned(false);
                                setModalVisible(!modalVisible);
                            }}>
                            <Text>Scan Again</Text>
                        </TouchableHighlight>
                    </View>
                </View>
            </Modal>
        </React.Fragment>
    )
}

const styles = StyleSheet.create({
    centeredView: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      marginTop: 22
    },
    modalView: {
      margin: 20,
      width: 200,
      backgroundColor: "rgb(30, 30, 30)",
      borderRadius: 20,
      padding: 35,
      alignItems: "center",
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 2
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5
    },
    openButton: {
      backgroundColor: "rgb(55, 55, 61)",
      borderRadius: 20,
      padding: 10,
      elevation: 2
    },
    modalText: {
      color: 'grey',
      marginBottom: 15,
      textAlign: "center"
    }
});

export default CodeScanner;