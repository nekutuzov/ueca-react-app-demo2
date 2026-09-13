import "./menu.css";

// MenuList / MenuSeparator — the presentation shell around MenuItem Views.
//
// PLAIN FUNCTIONS, like Block/Row/Col: a list surface and a divider hold no state. The panel
// chrome (surface, border, shadow) comes from whatever hosts the menu — normally a Popover with
// className="ueca-popover-menu", which swaps the popover's content padding for menu gutters.
//
// The owner composes: declare useMenuItem children on the screen model, then
//     <MenuList>
//         <model.exportItem.View />
//         <MenuSeparator />
//         <model.deleteItem.View />
//     </MenuList>

type MenuListProps = {
    children?: React.ReactNode;
};

function MenuList(props: MenuListProps): React.ReactElement {
    return (
        <div role="menu" className="ueca-menulist">
            {props.children}
        </div>
    );
}

function MenuSeparator(): React.ReactElement {
    return <div role="separator" className="ueca-menu-separator" />;
}

export { MenuListProps, MenuList, MenuSeparator };
