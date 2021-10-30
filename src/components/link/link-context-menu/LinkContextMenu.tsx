import { Popover, Button } from "antd";
import React, { useCallback, useState } from "react";
import { PropsWithChildren } from "react";
import { LinkModel } from "../Link";

function _LinkContextMenu(props: PropsWithChildren<{ linkModel: LinkModel, addJoint: (linkModel: LinkModel) => void }>) {

    const [menuVisible, setMenuVisible] = useState(false);

    const handleAddJoint = useCallback(() => {

        setMenuVisible(false);

        props.addJoint(props.linkModel);

    }, [setMenuVisible, props]);

    const handleRemoveLink = useCallback(() => {

        setMenuVisible(false);

    }, [setMenuVisible]);

    const menuContent = <>
        <div style={{ display: 'flex', flexDirection: 'column' }} >
            <Button type="link" onClick={handleAddJoint}>Add joint</Button>
            <Button type="link" onClick={handleRemoveLink}>Remove link</Button>
        </div>
    </>;
    return <>
        <Popover content={menuContent}  trigger="click" >
            {props.children}
        </Popover>
    </>
}

export const LinkContextMenu = React.memo(_LinkContextMenu);