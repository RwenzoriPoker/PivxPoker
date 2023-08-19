import modalStyle from "../modalStyle";
import imageCropStyle from "../imageCropStyle";

const lobbyStyle=(theme) => ({
    ...modalStyle(theme),
    ...imageCropStyle(theme)
});

export default lobbyStyle;