export const formatCurrency = (value: number | string) => {
    const numValue = Number(value);
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(numValue);
};

export const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    // Using UTC methods to avoid timezone shifts if the date is just "YYYY-MM-DD"
    // But a simpler way for display considering input is mostly YYYY-MM-DD
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
};

export const formatDateTime = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('pt-BR');
};
