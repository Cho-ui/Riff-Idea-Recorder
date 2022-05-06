import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';
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

    // TODO: flatlist this
    function getRecordingTakes() {
        return recordings.map((take, index) => {
            return (
                <View key={index} style={styles.row}>
                    <Text style={styles.fill}>Take {index + 1} - {take.duration}</Text>
                    <Button style={styles.button} onPress={() => take.sound.replayAsync()} title="Play" />
                    <Button style={styles.button} onPress={() => saveRecording(take.file)} title="Save" />
                </View>
            );
        });
    }

    async function saveRecording(recUri) {
        try {
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
            {getRecordingTakes()}
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