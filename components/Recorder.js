import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { Button, StyleSheet, Text, View, FlatList } from 'react-native';
import { Audio } from 'expo-av';
import * as MediaLibrary from 'expo-media-library';

export default function Recorder() {
    const [recording, setRecording] = useState();
    const [recordings, setRecordings] = useState([]);
    const [message, setMessage] = useState("");

    async function startRecording() {
        try {
            const permission = await Audio.requestPermissionsAsync();

            if (permission.status === "granted") { // for IOS, may not be needed since other features purely Android, check later
                await Audio.setAudioModeAsync({
                    allowsRecordingIOS: true,
                    playsInSilentModeIOS: true
                });
                const { recording } = await Audio.Recording.createAsync(
                    Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY
                );
                setRecording(recording);
            } else {
                setMessage("Please grant permission for app to access the microphone");
            }
        } catch (err) {
            console.error('Failed to start recording', err);
        }
    }

    async function stopRecording() {
        setRecording(undefined);
        await recording.stopAndUnloadAsync();

        let updatedRecordings = [...recordings];
        const { sound, status } = await recording.createNewLoadedSoundAsync();
        updatedRecordings.push({
            sound: sound,
            duration: getDurationFormatted(status.durationMillis),
            file: recording.getURI()
        });

        setRecordings(updatedRecordings);
    }

    function getDurationFormatted(mSeconds) {
        const min = mSeconds / 1000 / 60;
        const minDisplay = Math.floor(min);
        const sec = Math.round((min - minDisplay) * 60);
        const secDisplay = sec < 10 ? `0${sec}` : sec;
        return `${minDisplay}:${secDisplay}`;
    }

    async function saveRecording(recUri) {
        try {
            const mediaPerms = await MediaLibrary.requestPermissionsAsync();
            if (mediaPerms.status === "granted") {
                const asset = await MediaLibrary.createAssetAsync(recUri);
                const album = await MediaLibrary.getAlbumAsync('musicidearecorder');
                if (album == null) {
                    await MediaLibrary.createAlbumAsync('musicidearecorder', asset, true);
                    setRecordings([]);
                   // await MediaLibrary.deleteAssetsAsync(asset); <-- will delete, but causes thread issue
                } else {
                    await MediaLibrary.addAssetsToAlbumAsync([asset], album, true);
                    setRecordings([]);
                   // await MediaLibrary.deleteAssetsAsync(asset); <-- <-- will delete, but causes thread issue
                }
            }
        } catch (err) {
            console.error(err);
        }
    }

    return (
        <View style={styles.container}>
            <Text>{message}</Text>
            <Button
                title={recording ? 'Stop Recording' : 'Start Recording'}
                onPress={recording ? stopRecording : startRecording} />
            <Text>Takes</Text>
            <FlatList
            data={recordings}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({item, index}) => (
                <View style={styles.row}>
                    <Text style={styles.taketext}>Take {index + 1} - {item.duration}</Text>
                    <Button style={styles.button} onPress={() => item.sound.replayAsync()} title="Play" />
                    <Button style={styles.button} onPress={() => saveRecording(item.file)} title="Save" />
                </View>
            )}
             />
            <StatusBar style="auto" />
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    taketext: {
        marginRight: 16
    },
    button: {
        margin: 16
    }
});