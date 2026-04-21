import 'package:flutter_test/flutter_test.dart';

import 'package:sajedar_ai_news_app/main.dart';

void main() {
  testWidgets('Sajedar app renders masthead', (WidgetTester tester) async {
    await tester.pumpWidget(const SajedarNewsApp());
    await tester.pump();

    expect(find.text('Sajedar'), findsOneWidget);
    expect(find.text('Positive Nepali AI News'), findsOneWidget);
  });
}
