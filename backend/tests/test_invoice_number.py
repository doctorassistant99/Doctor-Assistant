import pytest
from datetime import datetime


def generate_invoice_number(dt: datetime, sequence: int) -> str:
    yymmdd = dt.strftime("%y%m%d")
    return f"{yymmdd}{sequence:04d}"


def test_invoice_format_is_yyyymmdd_sequence():
    dt = datetime(2026, 9, 1)
    invoice = generate_invoice_number(dt, 1)
    assert invoice == "2609010001"


def test_invoice_sequence_increments():
    dt = datetime(2026, 9, 1)
    assert generate_invoice_number(dt, 1) == "2609010001"
    assert generate_invoice_number(dt, 2) == "2609010002"


def test_invoice_sequence_pads_to_4_digits():
    dt = datetime(2026, 9, 1)
    assert generate_invoice_number(dt, 9999) == "2609019999"


def test_invoice_resets_with_date_change():
    dt1 = datetime(2026, 9, 1)
    dt2 = datetime(2026, 9, 2)
    assert generate_invoice_number(dt1, 1) == "2609010001"
    assert generate_invoice_number(dt2, 1) == "2609020001"


def test_invoice_never_duplicates():
    dt = datetime(2026, 9, 1)
    invoices = {generate_invoice_number(dt, i) for i in range(1, 1000)}
    assert len(invoices) == 999
