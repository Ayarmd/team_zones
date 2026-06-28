import '../../core/http/api_client.dart';
import '../../models/customer_ban_status.dart';

class CustomerBanRepository {
  CustomerBanRepository._();
  static final CustomerBanRepository instance = CustomerBanRepository._();

  Future<CustomerBanStatus> fetchStatus() async {
    final body = await ApiClient.instance.get('/customer/ban-status');
    if (body is! Map<String, dynamic>) {
      return CustomerBanStatus.none;
    }
    return CustomerBanStatus.fromJson(body);
  }
}
