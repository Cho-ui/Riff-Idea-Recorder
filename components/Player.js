import { StatusBar } from 'expo-status-bar';
import React, { useState, useEffect } from 'react';
import { View, Text, Button, StyleSheet, FlatList } from 'react-native'
import * as MediaLibrary from 'expo-media-library';
import { Audio } from 'expo-av';
import { Entypo } from '@expo/vector-icons';

export default function Recorder() {
    const [sound, setSound] = useState();
    const [audioAssets, setAudioAssets] = useState([]);
    const [shouldRender, setShouldRender] = useState();

    useEffect(() => {
        return sound
            ? () => {
                console.log('Unloading Sound');
                sound.unloadAsync();
            }
            : undefined;
    }, [sound]);

    useEffect(() => {
        setShouldRender(undefined);
    }, [shouldRender])

    async function getFiles() {
        try {
            const mediaLibraryPermissions = await MediaLibrary.requestPermissionsAsync();
            if (!mediaLibraryPermissions.granted) {
                return;
            }

            // get media asset objects from external "musicidearecorder"-album
            const assetAlbum = await MediaLibrary.getAlbumAsync('musicidearecorder');

            if (assetAlbum) {
                const assetTable = await MediaLibrary.getAssetsAsync({
                    mediaType: "audio",
                    album: assetAlbum,
                    first: 500
                }); // 500 files per PagedInfo page, if more files, needs a higher limit
                setAudioAssets(assetTable.assets);
            }

        } catch (err) {
            console.error(err);
        }
    }

    async function playClip(asset) {
        try {
            const { sound } = await Audio.Sound.createAsync(asset);
            setSound(sound);
            console.log('Playing Sound');
            await sound.playAsync();
        } catch (err) {
            console.error(err)
        }
    }

    async function playNext(asset, assetIndex) {
        try {
            const { sound } = await Audio.Sound.createAsync(asset);
            setSound(sound);
            sound.setOnPlaybackStatusUpdate((playbackStatus) => {
                const nextIndex = assetIndex + 1;
                if (playbackStatus.didJustFinish && nextIndex < audioAssets.length) {
                    playNext(audioAssets[nextIndex], nextIndex);
                }
            })
            console.log('Playing Sound');
            await sound.playAsync();
        } catch (err) {
            console.error(err);
        }
    }

    async function playAll() {
        try {
            const asset = audioAssets[0];
            const assetIndex = 0;
            const { sound } = await Audio.Sound.createAsync(asset);
            setSound(sound);
            sound.setOnPlaybackStatusUpdate((playbackStatus) => {
                if (playbackStatus.didJustFinish) {
                    const nextIndex = assetIndex + 1;
                    playNext(audioAssets[nextIndex], nextIndex);
                };
            });
            console.log('Playing Sound');
            await sound.playAsync();
        } catch (err) {
            console.error(err);
        }
    }

    function moveUp(index) {
        if (index != 0) {
            const asset = audioAssets[index];
            let assetArrayCopy = audioAssets;
            assetArrayCopy.splice(index, 1);
            assetArrayCopy.splice((index - 1), 0, asset);
            setAudioAssets(assetArrayCopy);
            setShouldRender(true);
        }
    }

    function moveDown(index) {
        if (index != (audioAssets.length - 1)) {
            const asset = audioAssets[index];
            let assetArrayCopy = audioAssets;
            assetArrayCopy.splice(index, 1);
            assetArrayCopy.splice((index + 1), 0, asset);
            setAudioAssets(assetArrayCopy);
            setShouldRender(true);
        }
    }

    function remove(asset) {
        let assetArrayCopy = audioAssets;
        let filteredArray = assetArrayCopy.filter(node => node.filename != asset.filename);
        setAudioAssets(filteredArray);
        setShouldRender(true);
    }

    function getDurationFormatted(asset) {
        const durInSec = asset.duration;
        const min = durInSec / 60;
        const minDisplay = Math.floor(min);
        const sec = Math.round((min - minDisplay) * 60);
        const secDisplay = sec < 10 ? `0${sec}` : sec;
        return `${minDisplay}:${secDisplay}`;
    }

    const listHeader = () => {
        return (
            <View style={styles.headerContainer}>
                <Text style={styles.listHeader}>Playlist</Text>
            </View>
        )
    }

    return (
        <View style={styles.container}>
            <Button title="Get Local Files" onPress={getFiles} color="blue" />
            <View style={{ flex: 0.1 }} />
            <Button title="Play All" onPress={playAll} color="green" />
            <FlatList
                data={audioAssets}
                ListHeaderComponent={listHeader}
                extraData={audioAssets} // TODO: test whether relevant
                keyExtractor={(item) => item.filename}
                renderItem={({ item, index }) => (
                    <View style={styles.row}>
                        <Text style={styles.cliptext}>Clip {index + 1} - {getDurationFormatted(item)}</Text>
                        <Entypo.Button name="arrow-with-circle-up" color="blue" backgroundColor="white" style={styles.button} onPress={() => moveUp(index)} title="Up" />
                        <Entypo.Button name="arrow-with-circle-down" color="blue" backgroundColor="white" style={styles.button} onPress={() => moveDown(index)} title="Down" />
                        <Entypo.Button name="controller-play" color="green" backgroundColor="white" style={styles.button} onPress={() => playClip(item)} title="Play" />
                        <Entypo.Button name="circle-with-cross" color="red" backgroundColor="white" style={styles.button} onPress={() => remove(item)} title="Del" />
                    </View>
                )} />
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
    cliptext: {
        marginRight: 16
    },
    button: {
        margin: 10
    },
    headerContainer: {
        alignItems: 'center',
        paddingBottom: 10,
        paddingTop: 10
    },
    listHeader: {
        fontSize: 22,
        fontWeight: 'bold',
        color: "blue"
    }
});