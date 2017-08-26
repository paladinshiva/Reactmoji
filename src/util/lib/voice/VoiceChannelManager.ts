import { Collection, Guild, GuildChannel, VoiceChannel } from 'discord.js';
import { GuildStorage, ListenerUtil } from 'yamdbf';
import { SweeperClient } from '../SweeperClient';
import Constants from '../../Constants';
import * as Schedule from 'node-schedule';

const { on, registerListeners } = ListenerUtil;

export default class VoiceChannelManager {
	private client: SweeperClient;

	public constructor(client: SweeperClient) {
		this.client = client;
		registerListeners(this.client, this);
	}

	public async init(): Promise<void> {
		const guild: Guild = <Guild> this.client.guilds.get(Constants.serverId);

		await Schedule.scheduleJob('*/1 * * * *', async function() {
			await VoiceChannelManager.curateChannels(guild);
		});
	}

	public static async createChannel(guild: Guild): Promise<void> {
		let channel: VoiceChannel = guild.channels.find('id', Constants.baseVoiceChannelIdOne) as VoiceChannel;
		let channelName: string = this.getChannelName();
		let currentChannelNames: Array<string> = this.getCurrentChannelNames(guild);
		var channelPosition: number = this.getCurrentChannels(guild).last().position + 1;

		do { channelName = this.getChannelName(); }
		while (currentChannelNames.indexOf(channelName) !== -1);

		let newChannel: VoiceChannel = await channel.clone(channelName, true, true) as VoiceChannel;

		await newChannel.setPosition(channelPosition);
		await newChannel.setUserLimit(6);
	}

	public static async curateChannels(guild: Guild): Promise<void> {
		let voiceChannels: Collection<string, GuildChannel> = this.getCurrentChannels(guild);

		voiceChannels.forEach((channel: VoiceChannel) => {
			if ((channel.id !== Constants.baseVoiceChannelIdOne && channel.id !== Constants.baseVoiceChannelIdTwo) && channel.members.size === 0)
				channel.delete();
		});
	}

	public static getChannelCount(guild: Guild): int {
		return guild.channels.filter((channel: VoiceChannel, key: string, collection: Collection<string, VoiceChannel>) => {
			return (channel.type === 'voice' && channel.name.startsWith('Fireteam ')) ? true : false;
		}).size;
	}

	public static getEmptyChannelCount(guild: Guild): int {
		return guild.channels.filter((channel: VoiceChannel, key: string, collection: Collection<string, VoiceChannel>) => {
			return ((channel.type === 'voice' && channel.name.startsWith('Fireteam ')) && channel.members.size === 0) ? true : false;
		}).size;
	}

	public static getCurrentChannels(guild: Guild): Collection<string, GuildChannel> {
		return guild.channels.filter((channel: GuildChannel, key: string, collection: Collection<string, GuildChannel>) => {
			return (channel.type === 'voice' && channel.name.startsWith('Fireteam ')) ? true : false;
		});
	}

	public static getCurrentChannelNames(guild: Guild): Array<string> {
		let voiceChannels: Collection<string, GuildChannel> = guild.channels.filter((channel: GuildChannel, key: string, collection: Collection<string, GuildChannel>) => {
			return (channel.type === 'voice' && channel.name.startsWith('Fireteam ')) ? true : false;
		});

		return voiceChannels.map((channel: GuildChannel) => channel.name);
	}

	public static getChannelName(): string {
		return 'Fireteam ' + Constants.channelNames[Math.floor(Math.random() * Constants.channelNames.length)];
	}
}
