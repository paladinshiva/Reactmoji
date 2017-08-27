import { Collection, Guild, GuildChannel, GuildMember, VoiceChannel } from 'discord.js';
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

	public static async curateChannels(guild: Guild): Promise<void> {
		let emptyChannels: Array<VoiceChannel> = this.getEmptyChannels(guild).map((channel: VoiceChannel) => { return channel; });
		let zavalaHasUsers: boolean = ((guild.channels.find('id', Constants.baseVoiceChannelIdOne) as VoiceChannel).members.size > 0) ? true : false;
		let ikoraHasUsers: boolean = ((guild.channels.find('id', Constants.baseVoiceChannelIdTwo) as VoiceChannel).members.size > 0) ? true : false;

		emptyChannels.forEach((channel: VoiceChannel) => {
			if ((channel.id !== Constants.baseVoiceChannelIdOne && channel.id !== Constants.baseVoiceChannelIdTwo))
				channel.delete();
		});

		if (zavalaHasUsers && ikoraHasUsers)
			this.createTempChannel(guild);
	}

	public static async createChannel(member: GuildMember): Promise<void> {
		let channel: VoiceChannel = member.guild.channels.find('id', Constants.baseVoiceChannelIdOne) as VoiceChannel;
		let channelName: string = this.getChannelName();
		let currentChannelNames: Array<string> = this.getCurrentChannelNames(member.guild);

		do { channelName = this.getChannelName(); }
		while (currentChannelNames.indexOf(channelName) !== -1);

		let newChannel: VoiceChannel = await channel.clone(channelName, true, true) as VoiceChannel;

		await newChannel.setPosition(member.voiceChannel.position + 1);
		await newChannel.setUserLimit(6);
	}

	public static async createTempChannel(guild: Guild): Promise<void> {
		let channel: VoiceChannel = guild.channels.find('id', Constants.baseVoiceChannelIdTwo) as VoiceChannel;
		let channelName: string = this.getChannelName();
		let currentChannelNames: Array<string> = this.getCurrentChannelNames(guild);

		do { channelName = this.getChannelName(); }
		while (currentChannelNames.indexOf(channelName) !== -1);

		let newChannel: VoiceChannel = await channel.clone(channelName, true, true) as VoiceChannel;

		await newChannel.setPosition(channel.position + 1);
		await newChannel.setUserLimit(6);
	}

	public static getChannelCount(guild: Guild): number {
		return guild.channels.filter((channel: VoiceChannel, key: string, collection: Collection<string, VoiceChannel>) => {
			return (channel.type === 'voice' && channel.name.startsWith('Fireteam ')) ? true : false;
		}).size;
	}

	public static getEmptyChannels(guild: Guild): Collection<string, GuildChannel> {
		return guild.channels.filter((channel: VoiceChannel, key: string, collection: Collection<string, VoiceChannel>) => {
			return ((channel.type === 'voice' && channel.name.startsWith('Fireteam ')) && channel.members.size === 0) ? true : false;
		});
	}

	public static getUsedChannels(guild: Guild): Collection<string, GuildChannel> {
		return guild.channels.filter((channel: VoiceChannel, key: string, collection: Collection<string, VoiceChannel>) => {
			return ((channel.type === 'voice' && channel.name.startsWith('Fireteam ')) && channel.members.size !== 0) ? true : false;
		});
	}

	public static getUsedChannelsCount(guild: Guild): number {
		return guild.channels.filter((channel: VoiceChannel, key: string, collection: Collection<string, VoiceChannel>) => {
			return ((channel.type === 'voice' && channel.name.startsWith('Fireteam ')) && channel.members.size !== 0) ? true : false;
		}).size;
	}

	public static getEmptyChannelCount(guild: Guild): number {
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
