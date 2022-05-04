import { StatusBar } from 'expo-status-bar';
import React, { useState, useEffect } from 'react';
import { Button, StyleSheet, Text, View, PermissionsAndroid } from 'react-native';
import { Audio } from 'expo-av';
import { StorageAccessFramework } from 'expo-file-system';
import * as FileSystem from 'expo-file-system';
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
        const uri = recording.getURI();
        alert(uri);

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

    function getRecordingLines() {
        return recordings.map((recordingLine, index) => {
            return (
                <View key={index} style={styles.row}>
                    <Text style={styles.fill}>Recording {index + 1} - {recordingLine.duration}</Text>
                    <Button style={styles.button} onPress={() => recordingLine.sound.replayAsync()} title="Play" />
                    <Button style={styles.button} onPress={() => saveRecording(recordingLine.file)} title="Save" />
                </View>
            );
        });
    }

    async function saveRecording(recUri) {
        try {
            /*if (filePermissions.granted === false && filePermissions.directoryUri === "") {
                const albumUri = StorageAccessFramework.getUriForDirectoryInRoot("exporecordings");
                const permissions = await StorageAccessFramework.requestDirectoryPermissionsAsync(albumUri);
                
                if (permissions.granted && permissions.directoryUri)
                setFilePermissions = {granted: permissions.granted, directoryUri: permissions.directoryUri};
            }*/

            /*const downloadedAudio = await FileSystem.downloadAsync(recUri, FileSystem.documentDirectory);
            if (downloadedAudio.status != 200) {
                alert("DL status issue")
                return;
            } */

            /*let mediaPerms = requestPermission(status);
            if ((await mediaPerms).status != 'granted') return;*/

            const mediaPerms = await MediaLibrary.requestPermissionsAsync();
            if (mediaPerms.status === "granted") {
                const asset = await MediaLibrary.createAssetAsync(recUri);
                const album = await MediaLibrary.getAlbumAsync('mirecorder');
                if (album == null) {
                    // TODO: Delete original file? Clear the clip list once saved?
                    await MediaLibrary.createAlbumAsync('mirecorder', asset, true);
                } else {
                    await MediaLibrary.addAssetsToAlbumAsync([asset], album, true);
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
            {getRecordingLines()}
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
    fill: {
        flex: 1,
        margin: 16
    },
    button: {
        margin: 16
    }
});