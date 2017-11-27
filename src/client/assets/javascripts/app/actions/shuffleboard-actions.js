export const SET_BOARD_DIMENSIONS = 'SET_BOARD_DIMENSIONS'

export function setBoardDimensions ({
	boardLength,
	boardWidth,
	lengthOffset
}) {
	return {
		type: SET_BOARD_DIMENSIONS,
		boardLength,
		boardWidth,
		lengthOffset
	}
}