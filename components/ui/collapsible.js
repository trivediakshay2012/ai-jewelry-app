"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Collapsible = Collapsible;
var react_1 = require("react");
var react_native_1 = require("react-native");
var themed_text_1 = require("@/components/themed-text");
var themed_view_1 = require("@/components/themed-view");
var icon_symbol_1 = require("@/components/ui/icon-symbol");
var theme_1 = require("@/constants/theme");
var use_color_scheme_1 = require("@/hooks/use-color-scheme");
function Collapsible(_a) {
    var _b;
    var children = _a.children, title = _a.title;
    var _c = (0, react_1.useState)(false), isOpen = _c[0], setIsOpen = _c[1];
    var theme = (_b = (0, use_color_scheme_1.useColorScheme)()) !== null && _b !== void 0 ? _b : 'light';
    return (<themed_view_1.ThemedView>
      <react_native_1.TouchableOpacity style={styles.heading} onPress={function () { return setIsOpen(function (value) { return !value; }); }} activeOpacity={0.8}>
        <icon_symbol_1.IconSymbol name="chevron.right" size={18} weight="medium" color={theme === 'light' ? theme_1.Colors.light.icon : theme_1.Colors.dark.icon} style={{ transform: [{ rotate: isOpen ? '90deg' : '0deg' }] }}/>

        <themed_text_1.ThemedText type="defaultSemiBold">{title}</themed_text_1.ThemedText>
      </react_native_1.TouchableOpacity>
      {isOpen && <themed_view_1.ThemedView style={styles.content}>{children}</themed_view_1.ThemedView>}
    </themed_view_1.ThemedView>);
}
var styles = react_native_1.StyleSheet.create({
    heading: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    content: {
        marginTop: 6,
        marginLeft: 24,
    },
});
