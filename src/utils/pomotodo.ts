import type { Pomodoro } from '../schemas/spaces';
import LoggerUtil from '../utils/logger';

export class PomodoroStatus {
    private pomodoro: Pomodoro;

    constructor(pomodoro: Pomodoro) {
        this.pomodoro = pomodoro;
    }

    getState() {
        return this.pomodoro.status;
    }

    setState(state) {
        this.pomodoro.status = state;
    }

    setEnd() {
        this.pomodoro.end = moment().format('YYYY-MM-DD HH:mm:ss');
    }

    getRealSpend() {
        const oldSpend = parseInt(this.pomodoro.spend);
        if (!this.pomodoro.lastactive) {
            return 0;
        }
        const lastTime = moment(parseInt(this.pomodoro.lastactive)).valueOf();
        const range = moment().valueOf() - lastTime;
        const spend = oldSpend + range;
        return spend;
    }

    getRemainTime() {
        const realSpend = this.getRealSpend();
        const expectedTime = parseInt(this.pomodoro.expectedTime);
        return expectedTime - realSpend;
    }

    setSpend() {
        this.pomodoro.spend = this.getRealSpend().toString();
    }

    isOutTime() {
        return this.getRealSpend() >= parseInt(this.pomodoro.expectedTime);
    }

    setBreakNum() {
        this.pomodoro.breaknum = (parseInt(this.pomodoro.breaknum) + 1).toString();
    }

    setStart() {
        this.pomodoro.start = moment().format('YYYY-MM-DD HH:mm:ss');
        this.pomodoro.lastactive = moment().valueOf().toString();
    }

    changeState(targetStatus) {
        const oldStatus = this.getState();
        if ([targetStatus, 'cancelled', 'done'].contains(oldStatus)) {
            return false;
        }
        return this[targetStatus + 'Fun'](targetStatus);
    }

    getPomodoro() {
        return this.pomodoro;
    }

    ingFun(targetStatus) {
        const currentStatus = this.getState();
        if (['done', 'cancelled', 'ing'].contains(currentStatus)) {
            return false;
        } else {
            LoggerUtil.log('开始任务');
            this.setStart();
            this.setState(targetStatus);
            return true;
        }
    }

    doneFun(targetStatus) {
        const currentStatus = this.getState();
        if (['cancelled', 'break', 'todo', 'break'].contains(currentStatus)) {
            return false;
        } else {
            LoggerUtil.log('完成任务');
            this.setEnd();
            this.setSpend();
            this.setState(targetStatus);
            return true;
        }
    }

    todoFun(targetStatus) {
        LoggerUtil.log('加入任务');
        this.setState(targetStatus);
        return true;
    }

    cancelledFun(targetStatus) {
        const oldStatus = this.getState();
        if (['done', 'cancelled'].contains(oldStatus)) {
            return false;
        } else {
            LoggerUtil.log('放弃任务');
            this.setSpend();
            this.setEnd();
            this.setState(targetStatus);
            return true;
        }
    }

    breakFun(targetStatus) {
        const oldStatus = this.getState();
        if (['done', 'cancelled', 'todo', 'break'].contains(oldStatus)) {
            return false;
        } else {
            LoggerUtil.log('暂停任务');
            // 统计并记录spend
            this.setSpend();
            this.setBreakNum();
            this.setState(targetStatus);
            return true;
        }
    }
}
