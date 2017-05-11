/**
 * 定时任务组件
 * setTask(task, interval, max); @return  一个任务标识，数字类型
 *		task 任务函数，接受三个参数，第一个参数是回调，用于通知任务执行结果， 第二个参数是当前任务执行次数，第三个参数是最大执行次数
 *				 如果不通知任务执行结果，则不继续执行下次的定时任务，如果执行结果失败，则继续执行，如果执行成功，则终止任务
 * 		interval 任务频率（非精确），单位是秒，如果设置为0，则仅仅执行一次
 *		max	任务执行最大次数，如果不设置或设置为0，则永不停止，除非任务执行成功
 * clearTask( id );
 *		id 任务执行标识，用于强制终止任务
 *
 */

let guid = 1;
let timer;
const taskCache = {};

class Task {
	constructor (task, interval, max) {
		this.work = task;
		this.guid = guid++;
		this.runNum = 0;
		this.interval = isNaN(interval) ? 0 : +interval * 1000;
		this.maxNum = this.interval ? max || 0 : 1;
		taskCache[this.guid] = this;
		Task.start();
	}

	static start () {
		if (timer) return;
		// 基本定时长度为250ms
		timer = window.setInterval(Task.loop, 250);
	}

	static loop () {
		let n = 0;
		for (const id in taskCache) {
			n++;
			taskCache[id].run();
		}
		if (n === 0) {
			window.clearInterval(timer);
			timer = 0;
		}
	}

	stop () {
		if (taskCache[this.guid]) {
			delete taskCache[this.guid];
		}
		this.running = 0;
		this.wrok = null;
	}

	run () {
		const now = new Date();
		// 如果上次任务尚未执行返回，则忽略一次
		if (this.running) return;

		/* eslint-disable max-len */
		// 如果还没有运行过，或上次运行时间距离现在的时间超过设置的间隔
		if (!this.lastRunTime || (now - this.lastRunTime >= this.interval && this.interval && (this.runNum < this.maxNum || !this.maxNum))) {
			this.running = 1;
			this.lastRunTime = now;
			this.runNum ++;
			try {
				// 传递this对象做为隐式控制接口
				this.work(this.notice.bind(this), this.runNum, this.maxNum);
			} catch (e) {
				console.log(`定时任务(${this.guid})运行错误！任务已经强制终止！`, e);
				this.stop();
			}
		}
		// 如果达到最大运行次数，则强制停止
		if (this.maxNum && this.runNum >= this.maxNum) this.stop();
	}

	notice (ok) {
		// 修改运行标志位
		this.running = 0;
		// 如果运行成功，则终止任务
		if (ok) this.stop();
	}
}

export const setTask = function setTask (task, interval, max) {
	if (!$.isFunction(task)) return -1;
	const ctr = new Task(task, interval, max);
	return ctr.guid;
};

export const clearTask = function clearTask (id) {
	if (!id) return;
	taskCache[id] && taskCache[id].stop();
};
