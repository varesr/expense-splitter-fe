# Handle negative transactions

When processing transactions, ensure that negative transactions are processed as negative, not with absolute numbers

As an example, negative transactions are used for refunds and cashbacks

Following example should reduce Chris' left to pay by 2.5
{
        "date": "02/02/2026",
        "description": "SAINSBURY'S             HORNSEY",
        "cardMember": "MR VARES",
        "accountNumber": "-41005",
        "amount": -5.00,
        "paidBy": "Split",
        "originallyPaidBy": "Roland",
        "source": "Amex"
    },