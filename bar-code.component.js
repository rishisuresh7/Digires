import React, {useEffect, useState, useRef} from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { BarCodeScanner } from 'expo-barcode-scanner';
import * as Haptics from 'expo-haptics';

const CodeScanner = ({setScannedItems}) => {
    const [hasPermission, setHasPermission] = useState(null);
    const [scanned, setScanned] = useState(false);
    const [scannedData, setScannedData] = useState('Start Scanning');
    const [items, setItems] = useState([]);

    useEffect(() => {
        (async () => { 
          const { status } = await BarCodeScanner.requestPermissionsAsync()
          if(status != null && !hasPermission) {
            setHasPermission(status === 'granted');
          }
        })();
      }, []);

    useEffect(() => {
        return () => {
            setScannedItems([...items]);
        }
    }, [items])

    const handleBarCodeScanned = ({ data }) => {
        setScanned(true);
        if (!items.includes(data)) {
            setItems([...items, data]);
            setScannedData('Scanned : ' + data);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        } else {
            setScannedData('Item already present');
        }
    };

    return (
        <React.Fragment>
            <View style={{flex: 1, backgroundColor: 'rgb(30, 30, 30)'}}>
                <BarCodeScanner
                    style = {{flex: 2}}
                    onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
                />
                <View style={styles.centeredView}>
                    <Text style={{top: -50, fontSize: 17, color: 'white',}}>{scannedData}</Text>
                    <TouchableOpacity style={styles.openButton} onPress={() => {
                                setScanned(false);
                                setScannedData('Scan Again');
                            }}>
                        <Text style={styles.modalText}>Scan Again</Text>
                    </TouchableOpacity>
                </View>
            </View>
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
    openButton: {
      backgroundColor: "rgb(55, 55, 61)",
      height: 60,
      width: 120,
      justifyContent: 'center',
      borderRadius: 30,
      borderWidth: 1,
      borderColor: 'grey',
    },
    modalText: {
      color: 'grey',
      textAlign: "center",
      fontSize: 17,
    }
});

export default CodeScanner;