/**
 * 
 * @param {*} robotModel 
 * @param {*} CommandModel 
 */
const currentState = (robotModel, CommandModel) => {

    const state = { type: 'update', value: {} };

    state.value.position = robotModel.getCurrentFlangePosition();
    state.value.servo = robotModel.isServoOn();
    state.value.speed = robotModel.getSpeedFactor();

    console.debug(state)

    return state;
}

module.exports = currentState;