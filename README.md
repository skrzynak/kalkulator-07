# Kalkulator kosztu projektu

Strona: https://skrzynak.github.io/kalkulator-07/

Dane są wspólne i publicznie edytowalne, zgodnie z przeznaczeniem kalkulatora. Zmiany zapisują się automatycznie po 700 ms, a otwarte strony odświeżają dane co 5 sekund. Każdy zapis łączy wyłącznie zmienione pola w PostgreSQL. Przy zmianie tego samego pola obowiązuje ostatni zapis.

Frontend używa publicznego klucza Supabase. Nigdy nie dodawaj klucza secret/service_role. Tabela calculator_state ma RLS, jeden stały rekord oraz uprawnienia SELECT i UPDATE(data). Nie przyznano uprawnień INSERT ani DELETE. Funkcja save_calculator działa jako SECURITY INVOKER, a trigger sprawdza dozwolone pola i wartości oraz aktualizuje rewizję i czas.

Przy awarii połączenia strona sygnalizuje brak zapisu i ponawia próbę. Niezapisane zmiany są zachowane w sessionStorage tej karty i przywracane po jej odświeżeniu. Przy opuszczaniu strony z niezapisanymi zmianami przeglądarka może wyświetlić ostrzeżenie. Nie zamykaj karty przed komunikatem „Zapisano online”.
