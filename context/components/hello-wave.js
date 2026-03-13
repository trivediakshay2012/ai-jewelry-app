"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HelloWave = HelloWave;
var react_native_reanimated_1 = require("react-native-reanimated");
function HelloWave() {
    return (<react_native_reanimated_1.default.Text style={{
            fontSize: 28,
            lineHeight: 32,
            marginTop: -6,
            animationName: {
                '50%': { transform: [{ rotate: '25deg' }] },
            },
            animationIterationCount: 4,
            animationDuration: '300ms',
        }}>
      👋
    </react_native_reanimated_1.default.Text>);
}
