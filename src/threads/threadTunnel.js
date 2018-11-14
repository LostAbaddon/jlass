/**
 * Name:	Thread Tunnel
 * Desc:    跨线程通道
 * Author:	LostAbaddon
 * Version:	0.0.1
 * Date:	2018.11.14
 */

if (!global._canThread) return;

load('./src/events/channel');
const Channel = _('Utils.Events.Channel');

class Tunnel {
	constructor (mgr) {
		this.id = String.random(64);
		this._mgr = mgr;
		this._channel = new Channel();
	}
	push (data) {
		return new Promise(async (res, rej) => {
			await this._channel.push(data);
			res();
		});
	}
	pull () {
		return new Promise(async (res, rej) => {
			this._mgr._sender('__tunnel__', {
				event: 'pull',
				id: this.id
			});
			var data = await this._channel.pull();
			res(data);
		});
	}
	kill () {
	}
	close () {
	}
	get alive () {
		return this._channel.alive
	}
}

class TunnelManager {
	constructor (sender) {
		this._pool = new Map();
		this._sender = sender;
	}
	getTunnel (id) {
		var tunnel;
		if (!!id && id.length === 64) {
			tunnel = this._pool.get(id);
		}
		if (!tunnel) {
			tunnel = new Tunnel(this);
			if (!!id) tunnel.id = id;
			this._pool.set(tunnel.id, tunnel);
			this._sender('tunnel', {
				event: 'create',
				id: tunnel.id
			});
		}
		return tunnel;
	}
	async gotPull (tid) {
		var tunnel = this._pool.get(tid);
		if (!tunnel) {
			this._sender('__tunnel__', {
				event: 'nil',
				id: tid
			});
			return;
		}
		var data = await tunnel._channel.pull();
		this._sender('__tunnel__', {
			event: 'data',
			id: tid,
			data
		});
	}
	gotNil (tid) {
		var tunnel = this._pool.get(tid);
		if (!tunnel) return;
		tunnel.push(undefined);
	}
	gotData (tid, data) {
		var tunnel = this._pool.get(tid);
		if (!tunnel) return;
		tunnel.push(data);
	}
	closeAll () {
	}
	killAll () {
	}
}

module.exports = TunnelManager;