export const getIcon = (icons = [], symbol) => {
    const find = icons.find(item => item.symbol.toUpperCase() === symbol.toUpperCase());
    if (find) {
        return `https://icons.mvcswap.com/resources/${find.logo}`
    }
    return null
}